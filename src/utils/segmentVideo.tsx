export type SegmentMethod = 'time' | 'size';

export interface SegmentOptions {
    method: SegmentMethod;
    value: number; // seconds for time-based, MB for size-based
    maxParallelProcessing?: number; // Maximum number of segments to process in parallel
}

export interface VideoSegment {
    id: string;
    blob: Blob;
    url: string;
    startTime?: number; // For time-based segments
    endTime?: number; // For time-based segments
    size?: number; // For size-based segments (in bytes)
    duration?: number; // Duration in seconds
    name: string;
}

export interface SegmentationProgress {
    progress: number; // 0-100
    currentSegment: number;
    totalSegments: number;
    status: 'idle' | 'loading' | 'processing' | 'complete' | 'error';
    error?: string;
}

/**
 * Segments a video file based on time or size
 * @param file The video file to segment
 * @param options Segmentation options
 * @param onProgress Callback for progress updates
 * @returns Promise resolving to an array of video segments
 */
export async function segmentVideo(
    file: File,
    options: SegmentOptions,
    onProgress: (progress: SegmentationProgress) => void
): Promise<VideoSegment[]> {
    // Set default max parallel processing (adjust based on device capabilities)
    const maxParallelProcessing = options.maxParallelProcessing || 2;
    
    // Initialize progress
    onProgress({
        progress: 0,
        currentSegment: 0,
        totalSegments: 0,
        status: 'loading',
    });

    try {
        // Create URL for original video (for fallback)
        const originalVideoUrl = URL.createObjectURL(file);

        // First, get the video duration
        const videoDuration = await getVideoDuration(file);

        if (!videoDuration) {
            throw new Error('Could not determine video duration');
        }

        onProgress({
            progress: 20,
            currentSegment: 0,
            totalSegments: 0,
            status: 'processing',
        });

        let segments: VideoSegment[] = [];
        let totalSegments = 0;
        
        // Create a segment definition array first
        const segmentDefinitions: { startTime: number; endTime: number; index: number }[] = [];

        if (options.method === 'time') {
            // Time-based segmentation
            const segmentDuration = options.value; // in seconds
            totalSegments = Math.ceil(videoDuration / segmentDuration);
            
            // Create segment definitions
            for (let i = 0; i < totalSegments; i++) {
                const startTime = i * segmentDuration;
                const endTime = Math.min((i + 1) * segmentDuration, videoDuration);
                segmentDefinitions.push({ startTime, endTime, index: i });
            }
        } else {
            // Size-based segmentation
            const targetSize = options.value * 1024 * 1024; // Convert MB to bytes
            // Estimate number of segments based on file size
            totalSegments = Math.ceil(file.size / targetSize);
            const segmentDuration = videoDuration / totalSegments;
            
            // Create segment definitions
            let currentTime = 0;
            for (let i = 0; i < totalSegments; i++) {
                const startTime = currentTime;
                const endTime = Math.min(currentTime + segmentDuration, videoDuration);
                segmentDefinitions.push({ startTime, endTime, index: i });
                currentTime = endTime;
            }
        }
        
        // Update progress with total segments
        onProgress({
            progress: 25,
            currentSegment: 0,
            totalSegments,
            status: 'processing',
        });
        
        // Process segments with controlled parallelism
        // This uses a sliding window approach to limit memory usage
        let processedCount = 0;
        
        // Process segments in batches to control memory usage
        for (let i = 0; i < segmentDefinitions.length; i += maxParallelProcessing) {
            const batch = segmentDefinitions.slice(i, i + maxParallelProcessing);
            
            // Process this batch in parallel
            const batchPromises = batch.map(async (def) => {
                try {
                    // Extract the segment
                    const segmentBlob = await extractVideoSegment(file, def.startTime, def.endTime);
                    const segmentUrl = URL.createObjectURL(segmentBlob);
                    
                    // Create segment object
                    return {
                        id: `segment-${def.index}`,
                        blob: segmentBlob,
                        url: segmentUrl,
                        startTime: def.startTime,
                        endTime: def.endTime,
                        duration: def.endTime - def.startTime,
                        size: segmentBlob.size,
                        name: options.method === 'time'
                            ? `Segment ${def.index + 1} (${formatTime(def.startTime)} - ${formatTime(def.endTime)})`
                            : `Segment ${def.index + 1} (${formatSize(segmentBlob.size)})`,
                        index: def.index // Used for sorting later
                    };
                } catch (error) {
                    console.error(`Error creating segment ${def.index}:`, error);
                    return null; // Return null for failed segments
                }
            });
            
            // Wait for all segments in this batch to complete
            const batchResults = await Promise.all(batchPromises);
            
            // Filter out failed segments and add to our segments array
            const validSegments = batchResults.filter(s => s !== null) as VideoSegment[];
            segments.push(...validSegments);
            
            // Update processed count and progress
            processedCount += batch.length;
            onProgress({
                progress: 25 + (processedCount / totalSegments) * 70,
                currentSegment: processedCount,
                totalSegments,
                status: 'processing',
            });
            
            // Allow a short delay between batches to prevent UI freezing
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Optionally, perform garbage collection to free memory
            if (typeof window.gc === 'function') {
                window.gc();
            }
        }
        
        // Sort segments by index to ensure they're in the correct order
        segments.sort((a, b) => {
            const indexA = a.id.split('-')[1];
            const indexB = b.id.split('-')[1];
            return parseInt(indexA) - parseInt(indexB);
        });

        // If no segments were created, add the original video as a single segment
        if (segments.length === 0) {
            segments.push({
                id: 'segment-original',
                blob: file,
                url: originalVideoUrl,
                startTime: 0,
                endTime: videoDuration,
                size: file.size,
                duration: videoDuration,
                name: `Full Video (${formatSize(file.size)})`,
            });
        }

        onProgress({
            progress: 100,
            currentSegment: segments.length,
            totalSegments: segments.length,
            status: 'complete',
        });

        return segments;
    } catch (error) {
        console.error('Video segmentation error:', error);
        onProgress({
            progress: 0,
            currentSegment: 0,
            totalSegments: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error during segmentation',
        });
        throw error;
    }
}

/**
 * Get the duration of a video file
 */
function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Error loading video metadata'));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Extract a segment from a video file with audio at maximum quality
 */
function extractVideoSegment(file: File, startTime: number, endTime: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.playsInline = true;
        // Ensure audio is enabled by not muting
        video.muted = false;
        
        // Set crossOrigin to anonymous to avoid CORS issues with some browsers
        video.crossOrigin = "anonymous";
        
        // Create canvas for capturing frames
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: false }); // Optimize for video
        
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }
        
        // Use a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Segment extraction timed out'));
        }, 60000); // 1 minute timeout
        
        // Cleanup function to prevent memory leaks
        const cleanup = () => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(video.src);
            video.onloadedmetadata = null;
            video.onerror = null;
            video.onseeked = null;
        };
        
        // Set up video metadata loaded handler
        video.onloadedmetadata = () => {
            // Set canvas size to match video's exact dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Seek to start time
            video.currentTime = startTime;
        };
        
        // When video has seeked to the start time
        video.onseeked = () => {
            try {
                // Get video stream from canvas at full framerate
                const videoStream = canvas.captureStream();
                
                // Get audio from the video element
                const audioTracks = video.captureStream().getAudioTracks();
                
                // Add audio tracks to our video stream if there are any
                if (audioTracks.length > 0) {
                    audioTracks.forEach((track: MediaStreamTrack) => {
                        videoStream.addTrack(track);
                    });
                }
                
                // Determine optimal MIME type and codec to preserve quality
                let mimeType = 'video/webm;codecs=vp9,opus';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    // Fall back to other codecs in order of preference
                    const alternatives = [
                        'video/webm;codecs=vp8,opus',
                        'video/webm',
                        'video/mp4'
                    ];
                    
                    for (const alt of alternatives) {
                        if (MediaRecorder.isTypeSupported(alt)) {
                            mimeType = alt;
                            break;
                        }
                    }
                }
                
                // Create a recorder with maximum quality settings
                const recorder = new MediaRecorder(videoStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 8000000, // 8 Mbps for high quality
                    audioBitsPerSecond: 128000   // 128 kbps for good audio
                });
                
                const chunks: Blob[] = [];
                
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };
                
                recorder.onstop = () => {
                    // Create the final output blob
                    const segmentBlob = new Blob(chunks, { type: mimeType.split(';')[0] });
                    cleanup();
                    resolve(segmentBlob);
                };
                
                // Request data frequently to maintain quality
                recorder.start(500);
                
                // Play the video at normal speed
                video.playbackRate = 1.0;
                video.play().catch(error => {
                    console.error('Error playing video:', error);
                    recorder.stop();
                    cleanup();
                    reject(new Error('Error playing video for segmentation'));
                });
                
                // Function to draw frames to canvas at maximum quality
                const drawFrame = () => {
                    if (video.currentTime < endTime) {
                        // Draw current frame at full quality
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Continue capturing frames at the video's natural rate
                        requestAnimationFrame(drawFrame);
                    } else {
                        // Stop recorder when we reach end time
                        video.pause();
                        
                        // Give a longer delay before stopping to ensure all data is captured
                        setTimeout(() => {
                            recorder.stop();
                        }, 200);
                    }
                };
                
                // Start drawing frames
                drawFrame();
            } catch (error) {
                console.error('Error setting up recording:', error);
                cleanup();
                reject(new Error('Error setting up recording'));
            }
        };
        
        // Handle errors
        video.onerror = () => {
            cleanup();
            reject(new Error('Error loading video for segmentation'));
        };
        
        // Load the video
        video.src = URL.createObjectURL(file);
    });
}

// Helper functions
function formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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

// Add TypeScript declaration for possible window.gc and missing browser APIs
declare global {
    interface Window {
        gc?: () => void;
    }
    
    interface HTMLVideoElement {
        captureStream(frameRate?: number): MediaStream;
    }
}