import class1Math from '../data/syllabus/class_1/mathematics.json';
import class1Science from '../data/syllabus/class_1/science.json';
import class1Language from '../data/syllabus/class_1/language.json';
import class2Math from '../data/syllabus/class_2/mathematics.json';
import class2Science from '../data/syllabus/class_2/science.json';
import class2Language from '../data/syllabus/class_2/language.json';
import class3Math from '../data/syllabus/class_3/mathematics.json';
import class3Science from '../data/syllabus/class_3/science.json';
import class3Language from '../data/syllabus/class_3/language.json';

export interface Lesson {
  id: string;
  title: string;
  content: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface SubjectSyllabus {
  class: number;
  subject: string;
  chapters: Chapter[];
}

export interface ClassItem {
  id: number;
  name: string;
  description: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const CLASSES_LIST: ClassItem[] = [
  { id: 1, name: "Class 1", description: "Primary Level - Foundation Skills" },
  { id: 2, name: "Class 2", description: "Primary Level - Intermediate Concepts" },
  { id: 3, name: "Class 3", description: "Primary Level - Advanced Basics" },
];

export const SUBJECTS_LIST: SubjectItem[] = [
  { id: "mathematics", name: "Mathematics", icon: "📐", color: "#1e40af" },
  { id: "science", name: "Science", icon: "🔬", color: "#047857" },
  { id: "language", name: "Language & Reading", icon: "📖", color: "#b45309" },
];

const SYLLABUS_REGISTRY: Record<string, SubjectSyllabus> = {
  "1_mathematics": class1Math as SubjectSyllabus,
  "1_science": class1Science as SubjectSyllabus,
  "1_language": class1Language as SubjectSyllabus,
  "2_mathematics": class2Math as SubjectSyllabus,
  "2_science": class2Science as SubjectSyllabus,
  "2_language": class2Language as SubjectSyllabus,
  "3_mathematics": class3Math as SubjectSyllabus,
  "3_science": class3Science as SubjectSyllabus,
  "3_language": class3Language as SubjectSyllabus,
};

export function getSyllabusData(classId: number, subjectId: string): SubjectSyllabus | null {
  const key = `${classId}_${subjectId.toLowerCase()}`;
  return SYLLABUS_REGISTRY[key] || null;
}
