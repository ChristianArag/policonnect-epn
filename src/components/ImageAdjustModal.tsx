"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  Maximize2,
  Minus,
  Move,
  Plus,
  RotateCw,
  X,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui";

interface ImageAdjustModalProps {
  imageSrc: string;
  onConfirm: (adjustedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageAdjustModal({
  imageSrc,
  onConfirm,
  onCancel,
}: ImageAdjustModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar imagen
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      // Resetear posición
      setOffset({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Manejadores de arrastre con mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Manejadores touch para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Rotar 90 grados
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Centrar y resetear
  const handleReset = () => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Generar imagen recortada final en Canvas
  const handleSaveCropped = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const outputSize = 320; // Resolución final de foto de perfil
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fondo blanco o transparente
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.save();
    // Mover al centro del canvas
    ctx.translate(outputSize / 2, outputSize / 2);
    // Aplicar rotación
    ctx.rotate((rotation * Math.PI) / 180);
    // Aplicar zoom
    ctx.scale(zoom, zoom);

    // Relación de escala respecto al viewport visual de 260px
    const viewPortScale = outputSize / 260;
    // Aplicar traslación con escala adaptada
    ctx.translate(offset.x * viewPortScale, offset.y * viewPortScale);

    // Calcular tamaño base proporcional
    const imgAspect = img.width / img.height;
    let drawWidth = outputSize;
    let drawHeight = outputSize;

    if (imgAspect > 1) {
      drawWidth = outputSize * imgAspect;
    } else {
      drawHeight = outputSize / imgAspect;
    }

    // Dibujar imagen centrada
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Exportar como Data URL JPEG ligera
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    onConfirm(dataUrl);
  }, [offset, zoom, rotation, onConfirm]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto animate-slide-up">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#003876]">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Ajustar foto de perfil</h3>
              <p className="text-[11px] text-gray-500">Arrastra y haz zoom para encuadrar tu rostro</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Área interactiva de encuadre */}
        <div className="relative flex items-center justify-center bg-slate-900 p-6 select-none overflow-hidden h-72">
          {/* Contenedor interactivo arrastrable */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative h-64 w-64 cursor-grab active:cursor-grabbing flex items-center justify-center"
          >
            {/* Imagen del usuario */}
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Vista previa"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center center",
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                className="pointer-events-none select-none transition-transform duration-75"
              />
            )}

            {/* Máscara circular con anillo guía de corte */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* Anillo de recorte circular */}
              <div className="h-56 w-56 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] ring-1 ring-[#003876]" />
            </div>

            {/* Icono de ayuda para arrastrar */}
            <div className="pointer-events-none absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur-sm">
              <Move className="h-3 w-3" />
              Arrastrar para centrar
            </div>
          </div>
        </div>

        {/* Controles de Zoom, Rotación y Centrado */}
        <div className="p-6 space-y-5 bg-white">
          {/* Slider de Zoom */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-[#003876]" />
                Zoom / Acercamiento
              </span>
              <span className="text-[11px] font-mono text-gray-500">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#003876]"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Botones de acción secundaria: Rotar y Centrar */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Rotar 90°
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Centrar
              </button>
            </div>
          </div>

          {/* Botones de Guardar / Cancelar */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveCropped}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#003876] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#002855] transition"
            >
              <Check className="h-4 w-4 text-[#FCD34D]" />
              Guardar y Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
