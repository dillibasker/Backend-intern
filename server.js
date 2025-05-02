// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://frontend-intern-9dr4.onrender.com',  // Allow only your frontend URL
  methods: ['GET', 'POST'],
}));
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  qualification: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true
  },
  hospital: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  consultationFee: {
    type: Number,
    required: true
  },
  availability: {
    type: Map,
    of: String,
    default: {}
  },
  
  isDoctor: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: null
  },
  languages: {
    type: [String],
    default: ['English']
  },
  availableForOnlineConsult: {
    type: Boolean,
    default: true
  },
  availableForHospitalVisit: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// Routes

// Get all doctors with optional filtering
app.get('/api/doctors', async (req, res) => {
  try {
    const { 
      specialty, 
      minExperience, 
      maxFee, 
      language,
      onlineConsult, 
      hospitalVisit
    } = req.query;

    let filter = {};

    // Apply filters if provided
    if (specialty) filter.specialty = { $regex: specialty, $options: 'i' };
    if (minExperience) filter.experience = { $gte: parseInt(minExperience) };
    if (maxFee) filter.consultationFee = { $lte: parseInt(maxFee) };
    if (language) filter.languages = { $in: [language] };
    if (onlineConsult === 'true') filter.availableForOnlineConsult = true;
    if (hospitalVisit === 'true') filter.availableForHospitalVisit = true;

    const doctors = await Doctor.find(filter).sort({ isDoctor: -1, experience: -1 });
    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Backend is working on Vercel!');
});

// Get doctor by ID
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new doctor
app.post('/api/doctors', async (req, res) => {
  try {
    const {
      name,
      specialty,
      qualification,
      experience,
      hospital,
      location,
      consultationFee,
      availability,
      isDoctor,
      profileImage,
      languages,
      availableForOnlineConsult,
      availableForHospitalVisit
    } = req.body;

    // Validate required fields
    if (!name || !specialty || !qualification || !experience || !location || !consultationFee) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newDoctor = new Doctor({
      name,
      specialty,
      qualification,
      experience,
      hospital: hospital || 'Apollo 24|7 Virtual Clinic',
      location,
      consultationFee,
      availability,
      isDoctor: isDoctor || false,
      profileImage,
      languages: languages || ['English'],
      availableForOnlineConsult: availableForOnlineConsult !== false,
      availableForHospitalVisit: availableForHospitalVisit !== false
    });

    const savedDoctor = await newDoctor.save();
    res.status(201).json(savedDoctor);
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor information
app.put('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const {
      name,
      specialty,
      qualification,
      experience,
      hospital,
      location,
      consultationFee,
      availability,
      isDoctor,
      profileImage,
      languages,
      availableForOnlineConsult,
      availableForHospitalVisit
    } = req.body;

    // Update fields if provided
    if (name) doctor.name = name;
    if (specialty) doctor.specialty = specialty;
    if (qualification) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (hospital) doctor.hospital = hospital;
    if (location) doctor.location = location;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (availability !== undefined) doctor.availability = availability;
    if (isDoctor !== undefined) doctor.isDoctor = isDoctor;
    if (profileImage) doctor.profileImage = profileImage;
    if (languages) doctor.languages = languages;
    if (availableForOnlineConsult !== undefined) doctor.availableForOnlineConsult = availableForOnlineConsult;
    if (availableForHospitalVisit !== undefined) doctor.availableForHospitalVisit = availableForHospitalVisit;

    const updatedDoctor = await doctor.save();
    res.json(updatedDoctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a doctor
app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor removed successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed sample data for development
app.post('/api/seed-doctors', async (req, res) => {
  try {
    // First clear existing data
    await Doctor.deleteMany({});
    
    const sampleDoctors = [
      {
        name: 'Liritha C',
        specialty: 'General Physician/ Internal Medicine Specialist',
        qualification: 'MBBS, MD (GENERAL MEDICINE)',
        experience: 5,
        hospital: 'Apollo 24|7 Virtual Clinic',
        location: 'Telangana, Hyderabad',
        consultationFee: 429,
        isDoctor: true,
        languages: ['English', 'Hindi', 'Telugu'],
        availableForOnlineConsult: true,
        availableForHospitalVisit: true
      },
      {
        name: 'Chandra Sekhar P',
        specialty: 'General Practitioner',
        qualification: 'MBBS',
        experience: 5,
        hospital: 'Apollo 24|7 Virtual Clinic',
        location: 'Karnataka, Bangalore',
        consultationFee: 399,
        availability: 7,
        languages: ['English', 'Kannada'],
        availableForOnlineConsult: true,
        availableForHospitalVisit: false
      },
      {
        name: 'Lakshmi Sindhura Kakani',
        specialty: 'General Physician/ Internal Medicine Specialist',
        qualification: 'MBBS, MD (GENERAL MEDICINE)',
        experience: 10,
        hospital: 'Apollo 24|7 Virtual Clinic',
        location: 'Delhi NCR',
        consultationFee: 499,
        availability: 15,
        languages: ['English', 'Hindi'],
        availableForOnlineConsult: true,
        availableForHospitalVisit: true
      },
      {
        name: 'Rahul Sharma',
        specialty: 'General Physician',
        qualification: 'MBBS, DNB',
        experience: 8,
        hospital: 'Apollo 24|7 Virtual Clinic',
        location: 'Mumbai, Maharashtra',
        consultationFee: 450,
        languages: ['English', 'Hindi', 'Marathi'],
        availableForOnlineConsult: true,
        availableForHospitalVisit: true
      },
      {
        name: 'Priya Patel',
        specialty: 'Internal Medicine',
        qualification: 'MBBS, MD',
        experience: 7,
        hospital: 'Apollo 24|7 Virtual Clinic',
        location: 'Gujarat, Ahmedabad',
        consultationFee: 350,
        availability: 20,
        languages: ['English', 'Hindi', 'Gujarati'],
        availableForOnlineConsult: true,
        availableForHospitalVisit: false
      }
    ];
    
    await Doctor.insertMany(sampleDoctors);
    res.json({ message: 'Sample doctors data seeded successfully' });
  } catch (error) {
    console.error('Error seeding doctors data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});