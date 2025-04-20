import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    segmentVideo,
    type SegmentMethod,
    type SegmentOptions,
    type VideoSegment,
    type SegmentationProgress
} from '@/utils/segmentVideo';
import { Loader2, Clock, FileBadge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoSegmenterProps {
    videoFile: File;
    videoUrl: string;
    onClose?: () => void;
}

export function VideoSegmenter({ videoFile, videoUrl, onClose }: VideoSegmenterProps) {
    const [method, setMethod] = useState<SegmentMethod>('time');
    const [value, setValue] = useState<number>(method === 'time' ? 60 : 10); // 60 seconds or 10MB default
    const [segments, setSegments] = useState<VideoSegment[]>([]);
    const [progress, setProgress] = useState<SegmentationProgress>({
        progress: 0,
        currentSegment: 0,
        totalSegments: 0,
        status: 'idle'
    });
    const [currentSegment, setCurrentSegment] = useState<string | null>(null);

    const handleSegment = async () => {
        try {
            const options: SegmentOptions = { method, value };
            const videoSegments = await segmentVideo(videoFile, options, setProgress);
            setSegments(videoSegments);

            // Auto-select first segment
            if (videoSegments.length > 0) {
                setCurrentSegment(videoSegments[0].id);
            }
        } catch (error) {
            console.error('Error segmenting video:', error);
        }
    };

    const getCurrentSegmentUrl = () => {
        if (!currentSegment) return videoUrl;
        const segment = segments.find(s => s.id === currentSegment);
        return segment ? segment.url : videoUrl;
    };

    const handleDownloadAll = () => {
        segments.forEach((segment, index) => {
            const a = document.createElement('a');
            a.href = segment.url;
            a.download = `segment_${index + 1}${getExtension(videoFile.name)}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    };

    const handleDownloadSegment = (segment: VideoSegment) => {
        const a = document.createElement('a');
        a.href = segment.url;
        a.download = `${segment.name}${getExtension(videoFile.name)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="w-full">
            <div className="border rounded-lg overflow-hidden mb-6">
                <div className="aspect-video relative bg-black">
                    <video
                        src={getCurrentSegmentUrl()}
                        controls
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Segmentation Controls */}
            <div className="border rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Video Segmentation</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm mb-2">Segmentation Method</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md border",
                                    method === 'time' ? "bg-primary text-primary-foreground" : "bg-background"
                                )}
                                onClick={() => {
                                    setMethod('time');
                                    setValue(60); // Reset to default value for time
                                }}
                            >
                                <Clock size={16} />
                                <span>Time-based</span>
                            </button>

                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md border",
                                    method === 'size' ? "bg-primary text-primary-foreground" : "bg-background"
                                )}
                                onClick={() => {
                                    setMethod('size');
                                    setValue(10); // Reset to default value for size
                                }}
                            >
                                <FileBadge size={16} />
                                <span>Size-based</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-2">
                            {method === 'time' ? 'Segment Duration (seconds)' : 'Segment Size (MB)'}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min={method === 'time' ? 5 : 1}
                                max={method === 'time' ? 300 : 50}
                                value={value}
                                onChange={(e) => setValue(Number(e.target.value))}
                                className="flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-right">
                                {value} {method === 'time' ? 's' : 'MB'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSegment}
                        disabled={progress.status === 'loading' || progress.status === 'processing'}
                    >
                        {(progress.status === 'loading' || progress.status === 'processing') ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                {progress.status === 'loading' ? 'Loading...' :
                                    `Processing ${progress.currentSegment}/${progress.totalSegments || '?'} (${Math.round(progress.progress)}%)`}
                            </>
                        ) : segments.length > 0 ? 'Re-segment Video' : 'Segment Video'}
                    </Button>
                </div>
            </div>

            {/* Segments List */}
            {segments.length > 0 && (
                <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Video Segments ({segments.length})</h3>
                        <Button
                            size="sm"
                            onClick={handleDownloadAll}
                        >
                            Download All
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {segments.map((segment) => (
                            <div
                                key={segment.id}
                                className={cn(
                                    "border rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                                    currentSegment === segment.id && "ring-2 ring-primary"
                                )}
                                onClick={() => setCurrentSegment(segment.id)}
                            >
                                <div className="aspect-video bg-black relative">
                                    <video
                                        src={segment.url}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-medium line-clamp-1">{segment.name}</h4>
                                        <button
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadSegment(segment);
                                            }}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7.5 10.625L4.375 7.5M7.5 10.625L10.625 7.5M7.5 10.625V2.5M13.125 10.625V11.875C13.125 12.2065 13.0065 12.5245 12.7955 12.7545C12.5846 12.9845 12.2946 13.125 11.9911 13.125H3.00893C2.70543 13.125 2.41547 12.9845 2.2045 12.7545C1.99353 12.5245 1.875 12.2065 1.875 11.875V10.625"
                                                    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {segment.duration && `Duration: ${formatDuration(segment.duration)}`}
                                        {segment.size && ` • Size: ${formatSize(segment.size)}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper functions
function formatDuration(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

function getExtension(filename: string): string {
    const match = filename.match(/\.[0-9a-z]+$/i);
    return match ? match[0] : '';
}