package controller;

import java.io.*;
import java.nio.file.*;
import jakarta.servlet.*;
import jakarta.servlet.annotation.*;
import jakarta.servlet.http.*;

@WebServlet(urlPatterns = {"/api/image"})
public class ImageServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        String imageName = req.getParameter("name");

        if (imageName == null || imageName.isEmpty()) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing image name");
            return;
        }

        // Chống path traversal
        String safeName = Paths.get(imageName).getFileName().toString();
        File file = new File(getServletContext().getRealPath("/assets/images"), safeName);

        if (!file.exists() || !file.isFile()) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String mimeType = getServletContext().getMimeType(safeName);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }
        resp.setContentType(mimeType);
        resp.setContentLengthLong(file.length());

        try (FileInputStream fis = new FileInputStream(file);
             OutputStream out = resp.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }
    }
}
