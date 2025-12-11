import { Router } from 'express';
import Teacher from '../models/Teacher.js';

const router = Router();

// GET /api/teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/teachers/seed 
router.get('/seed', async (req, res) => {
  const mockTeachers = [
    {
      name: "English Teacher Roz",
      tagline: "Professional Teacher",
      bio: "I am extremely patient and I love working with beginners.",
      avatar: "https://i.pravatar.cc/150?img=5",
      rating: 5.0,
      lessonCount: 1377,
      prices: { trial: 8, standard: 24 }
    },
    {
      name: "Paul Interview Coach",
      tagline: "Business & Interview Expert",
      bio: "Expert in job interview preparation and business English.",
      avatar: "https://i.pravatar.cc/150?img=11",
      rating: 4.9,
      lessonCount: 850,
      prices: { trial: 10, standard: 30 }
    }
  ];

  try {
    await Teacher.deleteMany({});
    await Teacher.insertMany(mockTeachers);
    res.json({ msg: "✅ Teachers seeded successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/teachers/:id  → Fetch one teacher by ID
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




router.post('/', async (req, res) => {
  const teacher = new Teacher({
    name: req.body.name,
    tagline: req.body.tagline,
    bio: req.body.bio,
    avatar: req.body.avatar,
    rating: req.body.rating || 5.0,
    lessonCount: req.body.lessonCount || 0,
    prices: {
      trial: req.body.prices.trial,
      standard: req.body.prices.standard
    }
  });

  try {
    const newTeacher = await teacher.save();
    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;