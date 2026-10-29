package com.keybarber.app.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadService {

    private final Cloudinary cloudinary;

    public UploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String subirImagen(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo seleccionado está vacío.");
        }

        // Si Cloudinary está configurado, sube a Cloudinary
        if (cloudinary != null) {
            try {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                        "folder", "keybarber",
                        "public_id", UUID.randomUUID().toString()
                ));
                if (uploadResult != null && uploadResult.containsKey("secure_url")) {
                    return (String) uploadResult.get("secure_url");
                }
            } catch (Exception e) {
                // Fallback a Base64 si Cloudinary falla o no tiene credenciales válidas
            }
        }

        // Almacenamiento directo seguro en Base64 Data URL
        String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        return "data:" + mimeType + ";base64," + base64;
    }
}
