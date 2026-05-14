import { useState } from 'react';
import Link from 'next/link';
import { FaChevronDown, FaChevronRight, FaCheckCircle, FaCircle } from 'react-icons/fa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const CourseExplorer = ({ courses }) => {
    return (
        <div className="space-y-4">
            {courses.map((course) => (
                <div key={course._id} className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    {/* Course Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-transparent to-gray-50/50 dark:to-slate-800/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{course.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${course.percentage}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{course.solved} / {course.total} Solved</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-indigo-600">{course.percentage}%</span>
                        </div>
                    </div>

                    {/* Topics Accordion */}
                    <Accordion type="single" collapsible className="w-full">
                        {course.topics.map((topic) => (
                            <AccordionItem key={topic._id} value={topic._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors no-underline">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className={`w-2 h-2 rounded-full ${topic.percentage === 100 ? 'bg-green-500' : topic.percentage > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{topic.title}</span>
                                        <span className="ml-auto mr-4 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-md">
                                            {topic.solved}/{topic.total}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-0 py-0 bg-gray-50/30 dark:bg-slate-900/30">
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {topic.problems.map((prob) => (
                                            <div key={prob._id} className="flex items-center justify-between px-6 py-3 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    {prob.status === 'Solved' ? 
                                                        <FaCheckCircle className="text-green-500 text-sm" /> : 
                                                        <FaCircle className="text-gray-200 dark:text-gray-700 text-xs" />
                                                    }
                                                    <Link href={`/problems/${prob._id}`} className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {prob.title}
                                                    </Link>
                                                </div>
                                                <Badge variant="outline" className={`
                                                    text-[10px] px-2 py-0 border-0
                                                    ${prob.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                                      prob.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                                                `}>
                                                    {prob.difficulty}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            ))}
        </div>
    );
};

export default CourseExplorer;