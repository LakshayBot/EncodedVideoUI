import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

type Testimonial = {
    name: string
    role: string
    image: string
    quote: string
}

const testimonials: Testimonial[] = [
    {
        name: 'Dr. Sarah Reynolds',
        role: 'Medical Research Director',
        image: 'https://randomuser.me/api/portraits/women/2.jpg',
        quote: 'EncodedVideo has transformed how we share sensitive medical procedure recordings. The browser-based encryption means we never worry about patient data exposure during sharing with remote specialists.',
    },
    {
        name: 'Michael Torres',
        role: 'Security Consultant',
        image: 'https://randomuser.me/api/portraits/men/8.jpg',
        quote: 'I recommend EncodedVideo to all my clients who need to secure video content. The client-side encryption approach eliminates many security vulnerabilities associated with traditional cloud video processing.',
    },
    {
        name: 'Jennifer Park',
        role: 'Investigative Journalist',
        image: 'https://randomuser.me/api/portraits/women/4.jpg',
        quote: 'This tool has been invaluable for my work. I can now secure sensitive footage directly in my browser before storing it, giving both me and my sources peace of mind.',
    },
    {
        name: 'Alex Morgan',
        role: 'Video Production Lead',
        image: 'https://randomuser.me/api/portraits/men/5.jpg',
        quote: 'The video segmentation feature is a game-changer for distributing content to our team. We can easily encrypt large files, split them into manageable chunks, and maintain complete security throughout our workflow.',
    },
    {
        name: 'Lisa Chen',
        role: 'Privacy Advocate',
        image: 'https://randomuser.me/api/portraits/women/10.jpg',
        quote: 'EncodedVideo represents the future of privacy-focused media tools. No data leaves your device unencrypted - exactly how all browser applications should be designed in 2023.',
    },
    {
        name: 'David Kwame',
        role: 'IT Manager',
        image: 'https://randomuser.me/api/portraits/men/11.jpg',
        quote: 'Implementing this tool across our organization has significantly reduced security concerns when handling confidential video content. The in-browser processing is remarkably efficient.',
    },
]

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
    const result: Testimonial[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
    }
    return result
}

const testimonialChunks = chunkArray(testimonials, Math.ceil(testimonials.length / 3))

export default function WallOfLoveSection() {
    return (
        <section>
            <div className="py-16 md:py-32">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="text-center">
                        <h2 className="text-title text-3xl font-semibold">Loved by the Community</h2>
                        <p className="text-body mt-6">Harum quae dolore orrupti aut temporibus ariatur.</p>
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
                        {testimonialChunks.map((chunk, chunkIndex) => (
                            <div key={chunkIndex} className="space-y-3">
                                {chunk.map(({ name, role, quote, image }, index) => (
                                    <Card key={index}>
                                        <CardContent className="grid grid-cols-[auto_1fr] gap-3 pt-6">
                                            <Avatar className="size-9">
                                                <AvatarImage alt={name} src={image} loading="lazy" width="120" height="120" />
                                                <AvatarFallback>ST</AvatarFallback>
                                            </Avatar>

                                            <div>
                                                <h3 className="font-medium">{name}</h3>

                                                <span className="text-muted-foreground block text-sm tracking-wide">{role}</span>

                                                <blockquote className="mt-3">
                                                    <p className="text-gray-700 dark:text-gray-300">{quote}</p>
                                                </blockquote>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
