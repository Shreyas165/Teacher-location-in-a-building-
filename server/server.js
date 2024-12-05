const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/www'));

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = path.join(__dirname, "public", "images");
        try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
        } catch (err) {
            console.error("Error creating images directory:", err);
            cb(err, null);
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only images are allowed."), false);
        }
    }
});


const resizeImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const filePath = req.file.path;
    const resizedFilePath = filePath.replace(/(\.[\w]+)$/, "-passport$1");

    try {
        await sharp(filePath)
            .resize(132, 170, { fit: 'fill' })
            .toFile(resizedFilePath);

        req.file.path = resizedFilePath;
        req.file.filename = path.basename(resizedFilePath);

        await fs.unlink(filePath);
        next();
    } catch (err) {
        console.error("Error resizing image:", err);
        res.status(500).json({ error: "Failed to process the uploaded image." });
    }
};


const csvFilePath = path.join('/tmp', 'directory.csv');


async function ensureDirectoryExists(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
        console.error(`Error creating directory ${dirPath}:`, err);
    }
}


async function readCSV() {
    try {
        const data = await fs.readFile(csvFilePath, "utf8");
        const rows = data.split("\n").filter(row => row.trim());
        return rows.map(row => {
            const [name, floor, branch, directions, image] = row.split(",");
            return { name: name?.trim(), floor: floor?.trim(), branch: branch?.trim(), directions: directions?.trim(), image: image?.trim() };
        });
    } catch (err) {
        console.error("Error reading temporary CSV file:", err);
        return [];
    }
}


async function writeCSV(teachers) {
    try {
        const rows = teachers.map(teacher =>
            `${teacher.name},${teacher.floor},${teacher.branch},${teacher.directions},${teacher.image}`
        );
        await fs.writeFile(csvFilePath, rows.join("\n"), "utf8");
    } catch (err) {
        console.error("Error writing to temporary CSV file:", err);
        throw err;
    }
}


app.get("/", (req, res) => {
    res.status(200).send("Welcome to the Teacher Directory API!");
});


app.get("/api/people", async (req, res) => {
    try {
        const teachers = await readCSV();
        res.status(200).json({ teachers: teachers.map(teacher => ({ name: teacher.name })) });
    } catch (error) {
        console.error("Error fetching teacher names:", error);
        res.status(500).json({ error: "Failed to fetch teacher data." });
    }
});


app.get("/api/directions/:name", async (req, res) => {
    try {
        const teacherName = req.params.name.toLowerCase();

        const teachers = await readCSV();
        const teacher = teachers.find(t => t.name.toLowerCase() === teacherName);

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found." });
        }

        const imageUrl = teacher.image
            ? `${req.protocol}://${req.get('host')}${teacher.image}`
            : null;

        res.status(200).json({
            name: teacher.name,
            floor: teacher.floor,
            branch: teacher.branch,
            directions: teacher.directions,
            imageUrl: imageUrl,
        });
    } catch (error) {
        console.error("Error fetching teacher details:", error);
        res.status(500).json({ error: "Failed to fetch teacher details." });
    }
});


app.post("/api/add-teacher", upload.single("image"), resizeImage, async (req, res) => {
    try {
        const { name, floor, branch, directions } = req.body;
        const image = req.file ? `/images/${req.file.filename}` : null;

        if (!name || !floor || !branch || !directions || !image) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const newTeacher = { name, floor, branch, directions, image };
        const teachers = await readCSV();
        teachers.push(newTeacher);

        await writeCSV(teachers);
        res.status(201).json({ message: "Teacher added successfully!" });
    } catch (error) {
        console.error("Error adding teacher:", error);
        res.status(500).json({ error: "Failed to add teacher." });
    }
});


app.put("/api/update-teacher/:name", async (req, res) => {
    try {
        const teacherName = req.params.name.toLowerCase();
        const { name, floor, branch, directions } = req.body;

        const teachers = await readCSV();
        const teacherIndex = teachers.findIndex(t => t.name.toLowerCase() === teacherName);

        if (teacherIndex === -1) {
            return res.status(404).json({ error: "Teacher not found." });
        }

        teachers[teacherIndex] = {
            ...teachers[teacherIndex],
            name: name || teachers[teacherIndex].name,
            floor: floor || teachers[teacherIndex].floor,
            branch: branch || teachers[teacherIndex].branch,
            directions: directions || teachers[teacherIndex].directions
        };

        await writeCSV(teachers);
        res.status(200).json({ message: "Teacher updated successfully." });
    } catch (error) {
        console.error("Error updating teacher:", error);
        res.status(500).json({ error: "Failed to update teacher." });
    }
});


app.delete("/api/delete-teacher/:name", async (req, res) => {
    try {
        const teacherName = req.params.name.toLowerCase();

        const teachers = await readCSV();
        const updatedTeachers = teachers.filter(t => t.name.toLowerCase() !== teacherName);

        if (teachers.length === updatedTeachers.length) {
            return res.status(404).json({ error: "Teacher not found." });
        }

        await writeCSV(updatedTeachers);
        res.status(200).json({ message: "Teacher deleted successfully." });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        res.status(500).json({ error: "Failed to delete teacher." });
    }
});


ensureDirectoryExists(path.join(__dirname, "/tmp"))
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to start server:", err);
    });
