import React, { useEffect, useRef, useState } from 'react';
import { PlayCircle, PauseCircle, Home } from 'lucide-react';

const CircleEscapeGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [balls, setBalls] = useState([]);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(0);

  class Ball {
    constructor(x, y) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 60;
      this.x = x + radius * Math.cos(angle);
      this.y = y + radius * Math.sin(angle);
      
      const speed = 0.3 + Math.random() * 0.5;
      const moveAngle = Math.random() * Math.PI * 2;
      this.dx = Math.cos(moveAngle) * speed;
      this.dy = Math.sin(moveAngle) * speed;
      
      this.radius = 6 + Math.random() * 3;
      this.mass = this.radius;
      this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
      this.escaped = false;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }

    resolveCollision(otherBall) {
      const dx = otherBall.x - this.x;
      const dy = otherBall.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.radius + otherBall.radius) {
        const nx = dx / distance;
        const ny = dy / distance;
        const rx = this.dx - otherBall.dx;
        const ry = this.dy - otherBall.dy;
        const velocityAlongNormal = rx * nx + ry * ny;

        if (velocityAlongNormal > 0) return;

        const restitution = 0.8;
        const j = -(1 + restitution) * velocityAlongNormal;
        const impulse = j / (1 / this.mass + 1 / otherBall.mass);

        const impulsex = nx * impulse;
        const impulsey = ny * impulse;

        this.dx -= impulsex / this.mass;
        this.dy -= impulsey / this.mass;
        otherBall.dx += impulsex / otherBall.mass;
        otherBall.dy += impulsey / otherBall.mass;

        const overlap = (this.radius + otherBall.radius - distance) / 2;
        const separationX = nx * overlap;
        const separationY = ny * overlap;

        this.x -= separationX;
        this.y -= separationY;
        otherBall.x += separationX;
        otherBall.y += separationY;
      }
    }

    update(circleX, circleY, circleRadius, rotation, otherBalls) {
      this.x += this.dx;
      this.y += this.dy;

      otherBalls.forEach(otherBall => {
        if (otherBall !== this) {
          this.resolveCollision(otherBall);
        }
      });

      const dx = this.x - circleX;
      const dy = this.y - circleY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      let normalizedAngle = (angle - rotation) % (Math.PI * 2);
      if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

      const gapSize = Math.PI / 30;
      const gapStart = -gapSize / 2;
      const gapEnd = gapSize / 2;

      if (distance >= circleRadius - this.radius) {
        if (normalizedAngle >= gapStart && normalizedAngle <= gapEnd) {
          if (distance >= circleRadius) {
            this.escaped = true;
          }
        } else {
          const normalAngle = Math.atan2(dy, dx);
          const bounceAngle = normalAngle + Math.PI;
          const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
          
          this.dx = Math.cos(bounceAngle) * speed * 0.95;
          this.dy = Math.sin(bounceAngle) * speed * 0.95;
          
          const pushBack = circleRadius - distance - this.radius;
          this.x += (dx / distance) * pushBack;
          this.y += (dy / distance) * pushBack;
        }
      }

      if (Math.random() < 0.01) {
        const jitter = 0.1;
        this.dx += (Math.random() - 0.5) * jitter;
        this.dy += (Math.random() - 0.5) * jitter;
      }
    }
  }

  const handleKeyDown = (e) => {
    if (gameState !== 'playing') return;
    
    if (e.key === 'ArrowLeft') {
      rotationRef.current -= 0.1;
    } else if (e.key === 'ArrowRight') {
      rotationRef.current += 0.1;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const WelcomeMenu = () => (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-blue-600">Circle Escape Game</h1>
      <div className="text-center text-gray-600 space-y-2">
        <p>Control the circle's rotation to prevent balls from escaping!</p>
        <p>Use ← and → arrow keys to rotate</p>
        <p>Each escaped ball creates three more!</p>
      </div>
      <button
        onClick={startNewGame}
        className="px-6 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Start Game
      </button>
    </div>
  );

  const GameControls = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 items-center text-lg">
        <div className="font-bold">Balls: {balls.length}</div>
        <div className="font-bold">Time: {Math.floor(gameTime)}s</div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {gameState === 'playing' ? (
            <><PauseCircle size={24} /> Pause</>
          ) : (
            <><PlayCircle size={24} /> Resume</>
          )}
        </button>
        <button
          onClick={() => setGameState('menu')}
          className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
        >
          <Home size={24} /> End Game
        </button>
      </div>
    </div>
  );

  const startNewGame = () => {
    setBalls([]);
    setScore(0);
    setGameTime(0);
    rotationRef.current = 0;
    lastTimeRef.current = Date.now();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const circleX = canvas.width / 2;
    const circleY = canvas.height / 2;
    const circleRadius = 150;

    if (balls.length === 0) {
      const initialBalls = Array(3).fill().map(() => 
        new Ball(circleX, circleY)
      );
      setBalls(initialBalls);
    }

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      
      setGameTime(prev => prev + deltaTime);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw rotating circle with gap
      ctx.save();
      ctx.translate(circleX, circleY);
      ctx.rotate(rotationRef.current);
      ctx.beginPath();
      ctx.arc(0, 0, circleRadius, Math.PI / 30, Math.PI * 2 - Math.PI / 30);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      const escapedBalls = [];
      balls.forEach(ball => {
        ball.update(circleX, circleY, circleRadius, rotationRef.current, balls);
        ball.draw(ctx);
        if (ball.escaped) {
          escapedBalls.push(ball);
        }
      });

      if (escapedBalls.length > 0) {
        const newBalls = [];
        escapedBalls.forEach(() => {
          for (let i = 0; i < 3; i++) {
            newBalls.push(new Ball(circleX, circleY));
          }
        });

        setBalls(prevBalls => 
          [...prevBalls.filter(ball => !ball.escaped), ...newBalls]
        );
        setScore(prev => prev + escapedBalls.length);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balls, gameState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      {gameState === 'menu' ? (
        <WelcomeMenu />
      ) : (
        <div className="flex flex-col items-center gap-6">
          <GameControls />
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border border-gray-200 rounded-lg bg-white"
          />
          <div className="text-sm text-gray-600">
            Use arrow keys ← → to rotate the circle
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleEscapeGame;
