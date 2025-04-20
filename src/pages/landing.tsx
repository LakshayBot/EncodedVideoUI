import React from 'react';
import HeroSection from '@/components/hero-section';
import FeaturesSection from '@/components/features-8';
import Testimonials from '@/components/testimonials';
import FooterSection from '@/components/footer';
import ContentSection from '@/components/content-7';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Hero Section (includes header) */}
            <HeroSection />

            {/* Features Section */}
            <section id="features" className="py-16 md:py-24">
                <div className="container mx-auto px-6">
                    <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl">
                        Private & Secure Video Tools
                    </h2>
                    <FeaturesSection />
                </div>
            </section>

            {/* Content Section - How it Works */}
            <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
                <div className="container mx-auto px-6">
                    <h2 className="mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl">
                        How It Works
                    </h2>
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <p className="text-lg text-muted-foreground">
                            EncodedVideo uses the latest Web APIs and WebAssembly to process videos entirely 
                            within your browser, ensuring maximum security and privacy.
                        </p>
                    </div>
                    <ContentSection />
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="bg-secondary/30 py-16 md:py-24 dark:bg-secondary/10">
                <div className="container mx-auto px-6">
                    <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl">
                        Trusted by Professionals
                    </h2>
                    <Testimonials />
                </div>
            </section>

            {/* Call to Action Section */}
            <section id="cta" className="py-16 md:py-24">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
                        Ready to Secure Your Videos?
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                        Process, encrypt, and segment your videos directly in your browser with no server uploads.
                        Your content stays private from start to finish.
                    </p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button asChild size="lg" className="shadow-lg">
                            <Link to="/tools">
                                Start Encrypting Now
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <a
                                href="https://github.com/your-repo"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Source Code
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <FooterSection />
        </div>
    );
}