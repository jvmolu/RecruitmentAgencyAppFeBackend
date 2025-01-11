import pdf from 'pdf-parse';

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
        const data = await pdf(pdfBuffer);
        return data.text;
    }
    catch (error) {
        console.error(error);
        return '';
    }
}

export { extractTextFromPDF };