import { Request, Response } from "express";
import cloudinary from "../config/cloudinary"; 

// export const uploadImage = async (req: Request, res: Response) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded!" });
//     }

//     const result = await new Promise((resolve, reject) => {
     
//       const timeout = setTimeout(() => {
//         reject(new Error("Cloudinary upload timed out!"));
//       }, 30000); 

//       const stream = cloudinary.uploader.upload_stream(
//         { folder: "products" }, 
//         (error, result) => {
//           clearTimeout(timeout); 
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
      
//       stream.end((req.file as any).buffer);
//     });

//     res.status(200).json({ imageUrl: (result as any).secure_url });
//   } catch (err: any) {
//     console.error("Cloudinary Error:", err);
   
//     if (err.message === "Cloudinary upload timed out!") {
//       return res.status(408).json({ message: "Upload too slow, please try again!" });
//     }
//     res.status(500).json({ message: "Upload failed!" });
//   }
// };


export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const result = await new Promise((resolve, reject) => {
      // memoryStorage භාවිතා කරන නිසා buffer එක පාවිච්චි කරන්න
      const stream = cloudinary.uploader.upload_stream(
        { folder: "store_logos" }, 
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      stream.end(req.file!.buffer);
    });

    res.status(200).json({ imageUrl: (result as any).secure_url });
  } catch (err: any) {
    console.error("Cloudinary Error:", err);
    res.status(500).json({ message: "Upload failed!" });
  }
};