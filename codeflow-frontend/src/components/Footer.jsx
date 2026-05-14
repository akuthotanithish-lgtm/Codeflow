const Footer = () => {
    return (
        <footer className="bg-secondary border-t border-gray-700 mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} CodeFlow. All Rights Reserved.</p>
                <p>Built with Next.js, Node.js, and ❤️</p>
            </div>
        </footer>
    );
};

export default Footer;