"use client";
import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeImg, setActiveImg] = useState(images[0] || "/placeholder.png");

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-inner group">
        <Image
          src={activeImg}
          alt={title}
          fill
          className="object-contain transition-all duration-500 group-hover:scale-105"
          priority
          quality={100}
          unoptimized
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(img)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                activeImg === img ? "border-orange-500 scale-95 shadow-md" : "border-gray-100 hover:border-orange-200"
              }`}
            >
              <Image
                src={img}
                alt={`${title} thumbnail ${i}`}
                fill
                className="object-cover p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
