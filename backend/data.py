"""
Mock syllabus and voice scenario dataset mirroring the ShikshaSetu mobile app local data.
"""

SYLLABUS_DATA = {
    1: {
        "class": 1,
        "name": "Class 1",
        "description": "Primary Level - Foundation Skills",
        "subjects": {
            "mathematics": {
                "class": 1,
                "subject": "mathematics",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Numbers 1 to 20",
                        "lessons": [
                            {
                                "id": "c1_m_l1",
                                "title": "Counting 1 to 10",
                                "content": "Let us learn counting numbers from 1 to 10. 1 (One Apple), 2 (Two Birds), 3 (Three Cats), 4 (Four Dogs), 5 (Five Stars), 6 (Six Flowers), 7 (Seven Bananas), 8 (Eight Balls), 9 (Nine Butterflies), 10 (Ten Pencils). Count items carefully by pointing to each one."
                            },
                            {
                                "id": "c1_m_l2",
                                "title": "Numbers 11 to 20",
                                "content": "Now let us count beyond 10! 11 is Ten and One. 12 is Ten and Two. 13 is Ten and Three. 14, 15, 16, 17, 18, 19, and 20 (Two Tens). Practice writing digits 11 through 20 in your notebook."
                            }
                        ]
                    },
                    {
                        "id": "ch2",
                        "title": "Shapes and Space",
                        "lessons": [
                            {
                                "id": "c1_m_l3",
                                "title": "Basic Shapes",
                                "content": "Shapes are all around us! A Circle is round like a wheel or a coin. A Square has four equal straight sides like a checkerboard. A Triangle has three corners and three sides. A Rectangle has four sides with opposite sides equal like a book cover."
                            },
                            {
                                "id": "c1_m_l4",
                                "title": "Inside and Outside",
                                "content": "Let us understand positions and space. 'Inside' means within a boundary, like toys inside a box. 'Outside' means out of the boundary, like birds outside a cage. Practice observing objects on top of, under, inside, and outside containers."
                            }
                        ]
                    }
                ]
            },
            "science": {
                "class": 1,
                "subject": "science",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Living and Non-Living Things",
                        "lessons": [
                            {
                                "id": "c1_s_l1",
                                "title": "Introduction to Living Things",
                                "content": "Living things can breathe, grow, move, eat food, and reproduce. Plants, animals, and humans are living things."
                            }
                        ]
                    }
                ]
            },
            "language": {
                "class": 1,
                "subject": "language",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Alphabets and Sounds",
                        "lessons": [
                            {
                                "id": "c1_l_l1",
                                "title": "Vowels and Consonants",
                                "content": "Letters make sounds! Learn the basic vowels A, E, I, O, U and practice phonics with simple words like Cat, Dog, and Sun."
                            }
                        ]
                    }
                ]
            }
        }
    },
    2: {
        "class": 2,
        "name": "Class 2",
        "description": "Primary Level - Intermediate Concepts",
        "subjects": {
            "mathematics": {
                "class": 2,
                "subject": "mathematics",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Addition and Subtraction",
                        "lessons": [
                            {
                                "id": "c2_m_l1",
                                "title": "Adding Two-Digit Numbers",
                                "content": "Learn how to combine two numbers. For example, 12 + 15 = 27. Start by adding the ones column, then the tens column."
                            }
                        ]
                    }
                ]
            },
            "science": {
                "class": 2,
                "subject": "science",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Plants Around Us",
                        "lessons": [
                            {
                                "id": "c2_s_l1",
                                "title": "Types of Plants",
                                "content": "Plants can be trees, shrubs, herbs, climbers, or creepers. Trees have thick wooden trunks, while herbs have soft green stems."
                            }
                        ]
                    }
                ]
            },
            "language": {
                "class": 2,
                "subject": "language",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Nouns and Naming Words",
                        "lessons": [
                            {
                                "id": "c2_l_l1",
                                "title": "What is a Noun?",
                                "content": "A noun is the name of a person, place, animal, or thing. Examples: Rahul, Delhi, Elephant, Pencil."
                            }
                        ]
                    }
                ]
            }
        }
    },
    3: {
        "class": 3,
        "name": "Class 3",
        "description": "Primary Level - Advanced Basics",
        "subjects": {
            "mathematics": {
                "class": 3,
                "subject": "mathematics",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Multiplication Basics",
                        "lessons": [
                            {
                                "id": "c3_m_l1",
                                "title": "Repeated Addition",
                                "content": "Multiplication is repeated addition! 3 groups of 4 apples equals 4 + 4 + 4 = 12 apples (3 x 4 = 12)."
                            }
                        ]
                    }
                ]
            },
            "science": {
                "class": 3,
                "subject": "science",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "The Human Body",
                        "lessons": [
                            {
                                "id": "c3_s_l1",
                                "title": "Sense Organs",
                                "content": "We have 5 sense organs: Eyes (seeing), Ears (hearing), Nose (smelling), Tongue (tasting), and Skin (touching)."
                            }
                        ]
                    }
                ]
            },
            "language": {
                "class": 3,
                "subject": "language",
                "chapters": [
                    {
                        "id": "ch1",
                        "title": "Verbs and Action Words",
                        "lessons": [
                            {
                                "id": "c3_l_l1",
                                "title": "Understanding Action Words",
                                "content": "Verbs describe actions. Words like run, jump, read, write, and sing show what a person or animal is doing."
                            }
                        ]
                    }
                ]
            }
        }
    }
}

VOICE_DEMO_SCENARIOS = {
    1: {
        "scenario_id": 1,
        "recognized_text": "कक्षा 1 गणित अध्याय 1 की गिनती सिखाएं",
        "translated_text": "ᱯᱟᱹᱦᱤᱞ ᱪᱟᱱᱟᱪ ᱮᱞᱠᱷᱟ ᱯᱟᱴᱷ ᱑ ᱞᱮᱠᱷᱟ ᱥᱮᱪᱮᱫ (Teach counting for Class 1 Mathematics Chapter 1)",
        "script": "sat_Olck",
        "audio_file": "scenario_1.mp3",
        "confidence": 1.0
    },
    2: {
        "scenario_id": 2,
        "recognized_text": "सजीव और निर्जीव वस्तुओं के उदाहरण बताएं",
        "translated_text": "ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱫᱟᱹᱭᱠᱟᱹ (Explain living and non-living objects)",
        "script": "sat_Olck",
        "audio_file": "scenario_2.mp3",
        "confidence": 1.0
    },
    3: {
        "scenario_id": 3,
        "recognized_text": "हिंदी वर्णमाला के स्वर और व्यंजन समझाएं",
        "translated_text": "ᱟᱠᱷᱚᱨ ᱜᱟᱵᱟᱱ ᱟᱨ ᱨᱟᱦᱟ ᱟᱲᱟᱝ ᱵᱩᱡᱷᱟᱹᱣ (Explain vowels and consonants in language learning)",
        "script": "sat_Olck",
        "audio_file": "scenario_3.mp3",
        "confidence": 1.0
    }
}
