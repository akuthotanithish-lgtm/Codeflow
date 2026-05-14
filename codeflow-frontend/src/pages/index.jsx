import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaRocket, FaCode, FaLaptopCode, FaBrain } from 'react-icons/fa';

const LandingPage = () => {
    return (
        <div className="bg-white">
            {/* HERO SECTION */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2"></span>
                        Now with AI Assistance v2.0
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
                        Master Coding <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">The Modern Way</span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        Solve problems, compete with friends, and get instant AI feedback. 
                        The most advanced platform for data structures and algorithms.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/signup">
                            <Button className="h-12 px-8 text-lg bg-gray-900 text-white hover:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link href="/problems">
                            <Button variant="outline" className="h-12 px-8 text-lg border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full">
                                Explore Problems
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* FEATURE GRID */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Everything you need to excel</h2>
                        <p className="text-gray-500 mt-2">Built for students, developers, and interview preppers.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<FaCode />}
                            title="Multi-Language Support"
                            desc="Run code in C++, Java, and Python with our high-performance cloud compiler."
                        />
                        <FeatureCard 
                            icon={<FaBrain />}
                            title="AI Assistant"
                            desc="Stuck? Get intelligent hints, complexity analysis, and debugging help instantly."
                        />
                        <FeatureCard 
                            icon={<FaLaptopCode />}
                            title="Real-world Projects"
                            desc="Don't just solve puzzles. Build comprehensive logic for real-world scenarios."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;