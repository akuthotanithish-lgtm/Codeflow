import Link from 'next/link';

const CourseCard = ({ course }) => {
    return (
        <div className="bg-secondary rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                <p className="text-light-gray mb-4">{course.description?.substring(0, 100)}...</p>
                <Link href={`/courses/${course._id}`} className="text-accent hover:underline font-semibold">
                    View Course &rarr;
                </Link>
            </div>
        </div>
    );
};

export default CourseCard;