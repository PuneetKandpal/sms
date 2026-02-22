'use client';
import Link from 'next/link';

/**
 * A styled “New Project” button that matches your wireframe.
 */
export default function NewProjectCard() {
  return (
    <Link href="/projects/new" className="inline-block">
      <button className="bg-primary hover:bg-primary/90 cursor-pointer transition-colors text-[#fafafa] font-semibold px-5 py-2.5 rounded-lg ">
        New Project
      </button>
    </Link>
  );
}
