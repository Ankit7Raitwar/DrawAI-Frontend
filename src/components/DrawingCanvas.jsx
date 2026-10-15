import { useEffect, useRef, useState } from "react";
import socket from "../socket";

function DrawingCanvas({ roomCode, isDrawer }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const handleDrawLine = (data) => {
      drawLine(
        ctx,
        data.x0,
        data.y0,
        data.x1,
        data.y1,
        data.color,
        data.brushSize
      );
    };

    const handleClearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("draw-line", handleDrawLine);
    socket.on("clear-canvas", handleClearCanvas);

    return () => {
      socket.off("draw-line", handleDrawLine);
      socket.off("clear-canvas", handleClearCanvas);
    };
  }, []);

  const getPosition = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event) => {
    if (!isDrawer) return;

    const { x, y } = getPosition(event);

    canvasRef.current.lastX = x;
    canvasRef.current.lastY = y;

    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawer || !isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPosition(event);

    drawLine(
      ctx,
      canvas.lastX,
      canvas.lastY,
      x,
      y,
      color,
      brushSize
    );

    socket.emit("draw-line", {
      roomCode,
      x0: canvas.lastX,
      y0: canvas.lastY,
      x1: x,
      y1: y,
      color,
      brushSize,
    });

    canvas.lastX = x;
    canvas.lastY = y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    socket.emit("clear-canvas", {
      roomCode,
    });
  };

  return (
    <div className="w-full">
      {isDrawer && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-slate-900 p-4">
          <label className="flex items-center gap-2 text-sm">
            Color
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            Size
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) =>
                setBrushSize(Number(e.target.value))
              }
            />
            <span>{brushSize}px</span>
          </label>

          <button
            onClick={clearCanvas}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold hover:bg-red-400"
          >
            Clear
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="block w-full rounded-xl bg-white shadow-lg"
        style={{
          touchAction: "none",
          cursor: isDrawer ? "crosshair" : "default",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}

function drawLine(ctx, x0, y0, x1, y1, color, brushSize) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.stroke();
}

export default DrawingCanvas;
