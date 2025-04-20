import { Card, CardContent } from '@/components/ui/card'
import { Shield, Users } from 'lucide-react'

export default function FeaturesSection() {
    return (
        <section className="py-12 lg:py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mb-8 max-w-[85%]">
                    <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Advanced video security and processing tools</h2>
                    <p className="text-muted-foreground mt-4 text-lg">
                        Our suite of tools helps you secure, process, and manage video content entirely within your browser.
                    </p>
                </div>
                <div>
                    <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:gap-8 xl:grid-cols-4">
                        <Card className="card variant-outlined relative col-span-full lg:col-span-2">
                            <CardContent className="pt-6">
                                <div className="relative z-10 mt-6 space-y-2 text-center">
                                    <h2 className="group-hover:text-secondary-950 text-lg font-medium transition dark:text-white">Client-Side Encryption</h2>
                                    <p className="text-foreground">End-to-end encryption happens directly in your browser. Your video content never leaves your device unencrypted.</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                            <CardContent className="pt-6">
                                <div className="relative z-10 mt-6 space-y-2 text-center">
                                    <h2 className="group-hover:text-secondary-950 text-lg font-medium transition dark:text-white">Video Segmentation</h2>
                                    <p className="text-foreground">Split large videos into smaller segments for easier management and sharing without losing quality.</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card variant-outlined relative col-span-full overflow-hidden lg:col-span-3">
                            <CardContent className="grid pt-6 sm:grid-cols-2">
                                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                                        <Shield className="m-auto size-5" strokeWidth={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="group-hover:text-secondary-950 text-lg font-medium text-zinc-800 transition dark:text-white">Military-Grade Encryption</h2>
                                        <p className="text-foreground">AES-256 encryption ensures your videos remain protected from unauthorized access.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card variant-outlined relative col-span-full overflow-hidden lg:col-span-1">
                            <CardContent className="grid pt-6">
                                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border dark:border-white/10 dark:before:border-white/5">
                                        <Users className="m-auto size-6" strokeWidth={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-medium transition">Privacy-Focused</h2>
                                        <p className="text-foreground">No server-side processing means your sensitive content stays private and secure.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}
