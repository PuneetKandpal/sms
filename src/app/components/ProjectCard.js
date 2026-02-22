'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProjectCard({ project }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#232323] rounded-lg p-4 hover:shadow-lg cursor-pointer"
    >
      <Link href={`/projects/${project.id}/manage/overview`}>
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <p className="text-sm text-gray-400">{project.description}</p>
      </Link>
    </motion.div>
  );
}