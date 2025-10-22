import { verifyAdmin } from "../../util/jwt-auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../img/uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

export default function UploadImageAPI(app, database) {
    // Upload image endpoint
    app.post('/api/upload-image', upload.single('image'), async (req, res) => {
        try {
            // Verify admin
            if (!(await verifyAdmin(req.query.token))) {
                // Delete uploaded file if unauthorized
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(401).send("Unauthorized");
            }

            if (!req.file) {
                return res.status(400).send("No file uploaded");
            }

            // Generate the URL path for the uploaded image
            const imageUrl = `/img/uploads/${req.file.filename}`;
            
            // If activiteitId is provided, save to database
            if (req.body.activiteitId) {
                const result = await database.query(
                    "INSERT INTO afbeeldingen (activiteitId, afbeeldingUrl) VALUES (?, ?)",
                    [req.body.activiteitId, imageUrl]
                );
                
                res.json({
                    success: true,
                    imageUrl: imageUrl,
                    imageId: result.insertId,
                    filename: req.file.filename
                });
            } else {
                // Just return the URL, will be saved later
                res.json({
                    success: true,
                    imageUrl: imageUrl,
                    filename: req.file.filename
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            // Delete uploaded file on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).send(error.message || "Error uploading image");
        }
    });

    // Delete uploaded image file
    app.delete('/api/upload-image', async (req, res) => {
        try {
            if (!(await verifyAdmin(req.query.token))) {
                return res.status(401).send("Unauthorized");
            }

            const { filename } = req.query;
            if (!filename) {
                return res.status(400).send("No filename provided");
            }

            const filePath = path.join(__dirname, '../../img/uploads', filename);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                res.json({ success: true, message: "File deleted" });
            } else {
                res.status(404).send("File not found");
            }
        } catch (error) {
            console.error('Delete error:', error);
            res.status(500).send(error.message || "Error deleting image");
        }
    });
}
