import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Check, X, Scissors, AlertCircle, FileVideo } from 'lucide-react'; // Added FileVideo
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VideoSegmenter } from '@/components/VideoSegmenter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoUploaderProps {
    onUploadComplete?: (file: File, videoUrl: string) => void;
    maxSizeMB?: number;
}

export function VideoUploader({
    onUploadComplete,
    maxSizeMB = 1024
}: VideoUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [showSegmenter, setShowSegmenter] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (videoUrlRef.current) {
                URL.revokeObjectURL(videoUrlRef.current);
                videoUrlRef.current = null;
            }
        };
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const simulateUpload = (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        if (videoUrlRef.current) {
            URL.revokeObjectURL(videoUrlRef.current);
        }

        setVideoFile(file);

        const videoUrl = URL.createObjectURL(file);
        videoUrlRef.current = videoUrl;

        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 10 + 5;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setIsUploading(false);
                setUploadedVideo(videoUrl);
                if (onUploadComplete) onUploadComplete(file, videoUrl);
            }
            setUploadProgress(currentProgress);
        }, 200);
    };

    const validateFile = (file: File): boolean => {
        if (!file.type.startsWith('video/')) {
            setUploadError('Please upload a valid video file.');
            return false;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            setUploadError(`File size exceeds the ${maxSizeMB}MB limit.`);
            return false;
        }
        setUploadError(null);
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                simulateUpload(file);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                simulateUpload(file);
            }
            e.target.value = '';
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const resetUpload = () => {
        if (videoUrlRef.current) {
            URL.revokeObjectURL(videoUrlRef.current);
            videoUrlRef.current = null;
        }
        setUploadedVideo(null);
        setVideoFile(null);
        setUploadProgress(0);
        setUploadError(null);
        setIsUploading(false);
        setShowSegmenter(false);
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {!uploadedVideo ? (
                <div
                    className={cn(
                        "relative group rounded-xl border border-border bg-card p-6 text-center transition-all duration-300 ease-out",
                        "hover:border-primary/40 hover:shadow-soft-md",
                        isDragging && "border-primary bg-primary/5 shadow-soft-lg scale-[1.02]",
                        (isUploading || uploadError) && "opacity-80 pointer-events-none"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={!isUploading ? triggerFileInput : undefined}
                >
                    <div className={cn(
                        "flex flex-col items-center justify-center space-y-4 py-8 sm:py-12 transition-opacity duration-300",
                        isUploading && "opacity-0"
                    )}>
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                            <Upload className="size-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Upload Your Video</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Drag & drop a video file here or <span className="text-primary font-medium">click to browse</span>.
                        </p>
                        <p className="text-xs text-muted-foreground pt-2">
                            Maximum file size: {maxSizeMB}MB
                        </p>
                    </div>

                    {isUploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-card/80 backdrop-blur-sm rounded-xl p-6 animate-fade-in">
                            <Loader2 className="size-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-foreground">Uploading {videoFile?.name ? `"${videoFile.name}"` : 'file'}...</p>
                            <Progress value={uploadProgress} className="w-full max-w-xs h-2" />
                            <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% complete</p>
                        </div>
                    )}

                    {uploadError && !isUploading && (
                        <Alert variant="destructive" className="mt-4 max-w-md mx-auto text-left animate-fade-in">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {uploadError}
                                <Button variant="ghost" size="sm" className="ml-2 h-auto py-0.5 px-1.5 text-xs" onClick={(e) => { e.stopPropagation(); setUploadError(null); }}>
                                    Dismiss
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="video/*"
                        className="hidden"
                        disabled={isUploading}
                    />
                </div>
            ) : showSegmenter && videoFile ? (
                <div className="animate-slide-in">
                    <VideoSegmenter
                        videoFile={videoFile}
                        videoUrl={uploadedVideo}
                        onClose={() => setShowSegmenter(false)}
                    />
                </div>
            ) : (
                <Card className="overflow-hidden animate-scale-in shadow-soft-md">
                    <div className="aspect-video relative bg-black/95">
                        <video
                            src={uploadedVideo}
                            controls
                            className="w-full h-full object-contain"
                            preload="metadata"
                        />
                    </div>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                                    <Check size={16} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Upload Successful</CardTitle>
                                    {videoFile && (
                                        <CardDescription className="text-xs truncate max-w-xs sm:max-w-sm">
                                            {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={resetUpload} title="Remove video">
                                <X size={18} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardFooter className="flex flex-wrap justify-end gap-3 bg-muted/30 py-3 px-6 border-t">
                        <Button
                            variant="outline"
                            onClick={resetUpload}
                            size="sm"
                            className="shadow-sm"
                        >
                            <Upload size={16} className="mr-2" />
                            Upload Another
                        </Button>
                        <Button
                            onClick={() => setShowSegmenter(true)}
                            size="sm"
                            className="shadow-sm"
                        >
                            <Scissors size={16} className="mr-2" />
                            Segment Video
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}