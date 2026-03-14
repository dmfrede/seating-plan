import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Table, Guest, SeatAssignment } from '../../types';
import { 
  metersToPixels, 
  getTableDimensions, 
  getSeatPositions,
  snapToGrid
} from '../../utils/canvas';
import { 
  COLORS, 
  PIXELS_PER_METER,
  GRID_SIZE_CM 
} from '../../utils/constants';

interface VenueCanvasProps {
  tables: Table[];
  guests: Guest[];
  seatAssignments: SeatAssignment[];
  venueWidth: number;
  venueHeight: number;
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
  onSeatClick: (tableId: string, seatIndex: number) => void;
  onAssignGuest: (guestId: string, tableId: string, seatIndex: number) => void;
  showGenderWarnings: boolean;
  hasGenderWarning: (tableId: string) => boolean;
}

export default function VenueCanvas({
  tables,
  guests,
  seatAssignments,
  venueWidth,
  venueHeight,
  selectedTableId,
  onSelectTable,
  onMoveTable,
  onAssignGuest,
  showGenderWarnings,
  hasGenderWarning,
}: VenueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState<{ tableId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; origOffsetX: number; origOffsetY: number } | null>(null);

  const vW = metersToPixels(venueWidth);
  const vH = metersToPixels(venueHeight);
  const gridPx = (GRID_SIZE_CM / 100) * PIXELS_PER_METER;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Venue background
    ctx.fillStyle = COLORS.venue;
    ctx.fillRect(0, 0, vW, vH);

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= vW; x += gridPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, vH);
      ctx.stroke();
    }
    for (let y = 0; y <= vH; y += gridPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(vW, y);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#c4b9ac';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, vW, vH);

    // Tables
    for (const table of tables) {
      drawTable(ctx, table, guests, seatAssignments, selectedTableId, hasGenderWarning, showGenderWarnings);
    }

    ctx.restore();
  }, [tables, guests, seatAssignments, selectedTableId, scale, offset, vW, vH, gridPx, hasGenderWarning, showGenderWarnings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  const findTableAt = (x: number, y: number): Table | null => {
    for (const table of [...tables].reverse()) {
      const dims = getTableDimensions(table.type);
      const dx = x - table.position.x;
      const dy = y - table.position.y;
      
      if (table.type === 'round') {
        const r = dims.width / 2;
        if (dx * dx + dy * dy <= r * r) return table;
      } else {
        if (Math.abs(dx) <= dims.width / 2 && Math.abs(dy) <= dims.height / 2) return table;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setPanning({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, origOffsetX: offset.x, origOffsetY: offset.y });
      return;
    }
    
    const pos = getCanvasPos(e);
    const table = findTableAt(pos.x, pos.y);
    
    if (table) {
      onSelectTable(table.id);
      setDragging({
        tableId: table.id,
        startX: pos.x,
        startY: pos.y,
        origX: table.position.x,
        origY: table.position.y,
      });
    } else {
      onSelectTable(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panning) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - rect.left - panning.startX;
      const dy = e.clientY - rect.top - panning.startY;
      setOffset({ x: panning.origOffsetX + dx, y: panning.origOffsetY + dy });
      return;
    }
    
    if (dragging) {
      const pos = getCanvasPos(e);
      const dx = pos.x - dragging.startX;
      const dy = pos.y - dragging.startY;
      const newX = snapToGrid(dragging.origX + dx, gridPx);
      const newY = snapToGrid(dragging.origY + dy, gridPx);
      onMoveTable(dragging.tableId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setPanning(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.3), 3));
  };

  const findSeatAt = (x: number, y: number): { tableId: string; seatIndex: number } | null => {
    for (const table of [...tables].reverse()) {
      const seatPositions = getSeatPositions(table);
      for (let i = 0; i < seatPositions.length; i++) {
        const sp = seatPositions[i];
        const sx = table.position.x + sp.x;
        const sy = table.position.y + sp.y;
        const dx = x - sx;
        const dy = y - sy;
        if (dx * dx + dy * dy <= 12 * 12) {
          return { tableId: table.id, seatIndex: i };
        }
      }
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    if (!guestId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    const seat = findSeatAt(x, y);
    if (seat) {
      onAssignGuest(guestId, seat.tableId, seat.seatIndex);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-stone-100">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: dragging ? 'grabbing' : panning ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setScale(s => Math.min(s * 1.2, 3))}
          className="w-8 h-8 bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-50 flex items-center justify-center shadow-sm"
        >
          +
        </button>
        <button
          onClick={() => setScale(1)}
          className="w-8 h-8 bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-50 flex items-center justify-center text-xs shadow-sm"
        >
          1:1
        </button>
        <button
          onClick={() => setScale(s => Math.max(s * 0.8, 0.3))}
          className="w-8 h-8 bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-50 flex items-center justify-center shadow-sm"
        >
          −
        </button>
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-stone-400 bg-white bg-opacity-80 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  table: Table,
  guests: Guest[],
  assignments: SeatAssignment[],
  selectedTableId: string | null,
  hasGenderWarning: (tableId: string) => boolean,
  showGenderWarnings: boolean
) {
  const { position, type, id } = table;
  const isSelected = selectedTableId === id;
  const dims = getTableDimensions(type);
  const tableAssignments = assignments.filter(a => a.tableId === id);
  const hasWarning = showGenderWarnings && hasGenderWarning(id);

  ctx.save();
  ctx.translate(position.x, position.y);

  const seatPositions = getSeatPositions(table);
  seatPositions.forEach((sp, seatIndex) => {
    const assignment = tableAssignments.find(a => a.seatIndex === seatIndex);
    const guest = assignment ? guests.find(g => g.id === assignment.guestId) : null;
    
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = guest ? COLORS.seatOccupied : COLORS.seatEmpty;
    ctx.fill();
    ctx.strokeStyle = guest ? '#6ab368' : '#e8a090';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    if (guest) {
      ctx.fillStyle = '#2d5c2a';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${guest.name[0]}${guest.surname[0]}`,
        sp.x, sp.y
      );
    }
  });

  if (type === 'round') {
    const r = dims.width / 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#d4a96a' : COLORS.tableRound;
    ctx.fill();
    ctx.strokeStyle = isSelected ? COLORS.tableSelected : COLORS.tableBorder;
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.stroke();
  } else {
    const w = dims.width;
    const h = dims.height;
    const rx = 6;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + rx, -h / 2);
    ctx.lineTo(w / 2 - rx, -h / 2);
    ctx.arcTo(w / 2, -h / 2, w / 2, -h / 2 + rx, rx);
    ctx.lineTo(w / 2, h / 2 - rx);
    ctx.arcTo(w / 2, h / 2, w / 2 - rx, h / 2, rx);
    ctx.lineTo(-w / 2 + rx, h / 2);
    ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - rx, rx);
    ctx.lineTo(-w / 2, -h / 2 + rx);
    ctx.arcTo(-w / 2, -h / 2, -w / 2 + rx, -h / 2, rx);
    ctx.closePath();
    ctx.fillStyle = isSelected ? '#d4a96a' : COLORS.tableLong;
    ctx.fill();
    ctx.strokeStyle = isSelected ? COLORS.tableSelected : COLORS.tableBorder;
    ctx.lineWidth = isSelected ? 3 : 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = '#4e3824';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(table.label, 0, 0);

  if (hasWarning) {
    ctx.beginPath();
    ctx.arc(dims.width / 2 - 8, -dims.height / 2 + 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('!', dims.width / 2 - 8, -dims.height / 2 + 8);
  }

  if (isSelected) {
    const r = (type === 'round' ? dims.width / 2 : Math.sqrt(dims.width ** 2 + dims.height ** 2) / 2) + 15;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.tableSelected;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}
