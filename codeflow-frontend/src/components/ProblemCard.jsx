import Link from 'next/link';

const ProblemCard = ({ problem }) => {
    const difficultyColor = {
        'Easy': 'text-green-400',
        'Medium': 'text-yellow-400',
        'Hard': 'text-red-400',
    };

    return (
        <Link href={`/problems/${problem._id}`}>
            <div className="bg-secondary p-4 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                <div>
                    <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
                </div>
                <span className={`font-medium ${difficultyColor[problem.difficulty]}`}>
                    {problem.difficulty}
                </span>
            </div>
        </Link>
    );
};

export default ProblemCard;