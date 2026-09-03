export default {
    builds: [
        {
            src: "*.html",
            use: "@vercel/static-build",
            config: {
                distDir: "."
            }
        }
    ]
};
