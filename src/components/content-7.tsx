import { Cpu, Zap, Lock, Shield, Eye } from 'lucide-react'

// Create a custom Image component for React+Vite
const Image = ({ src, alt, width, height, className }: { 
    src: string; 
    alt: string; 
    width: number; 
    height: number; 
    className?: string;
}) => {
    return (
        <img 
            src={src} 
            alt={alt} 
            width={width} 
            height={height} 
            className={className} 
        />
    );
};

export default function ContentSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">Secure video processing that puts privacy first.</h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            EncodedVideo leverages cutting-edge browser technologies to process your videos without ever sending them to a server. <span className="text-accent-foreground font-bold">Your data stays on your device.</span>
                        </p>
                        <p className="text-muted-foreground">All encryption and processing happens locally in your browser, using WebAssembly for near-native performance while maintaining complete privacy.</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="size-4" />
                                    <h3 className="text-sm font-medium">End-to-End Encryption</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Military-grade AES encryption secures your videos from unauthorized access.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Shield className="size-4" />
                                    <h3 className="text-sm font-medium">Zero Data Transfer</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">Content never leaves your device unencrypted, eliminating privacy concerns.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Lightning Fast</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">WebAssembly technology delivers near-native processing speeds right in your browser.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Eye className="size-4" />
                                    <h3 className="text-sm font-medium">Privacy Focused</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">No accounts, tracking, or data collection—just secure video processing.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-6 sm:mt-0">
                        <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
                            <Image src="/video-encryption-demo.png" className="hidden rounded-[15px] dark:block" alt="Video encryption illustration dark" width={1206} height={612} />
                            <Image src="/video-encryption-demo-light.png" className="rounded-[15px] shadow dark:hidden" alt="Video encryption illustration light" width={1206} height={612} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
