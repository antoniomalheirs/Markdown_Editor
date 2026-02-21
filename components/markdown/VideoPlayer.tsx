"use client";

import React, { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

export const VideoPlayer = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    const togglePlay = () => {
        if (videoRef.current) {
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
    };

    return (
        <div className="my-8 rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-black/5 aspect-video relative group">
            <video
                ref={videoRef}
                src={src}
                controls
                className="w-full h-full object-contain"
                onPlay={() => {
                    setIsPlaying(true);
                    setTimeout(() => setShowOverlay(false), 2000);
                }}
                onPause={() => {
                    setIsPlaying(false);
                    setShowOverlay(true);
                }}
            />
            <div
                onClick={togglePlay}
                className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-all duration-300 ${showOverlay || !isPlaying ? 'bg-black/20 opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-100'
                    }`}
            >
                <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    {isPlaying ? <Pause size={42} className="text-white fill-white shadow-xl" /> : <Play size={42} className="text-white fill-white ml-1 shadow-xl" />}
                </div>
            </div>
        </div>
    );
};
