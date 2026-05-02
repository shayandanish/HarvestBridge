const { processAndUploadImage, uploadDocument } = require('../../src/utils/fileUpload');
const { uploadFile } = require('../../src/config/storage');
const sharp = require('sharp');

jest.mock('../../src/config/storage', () => ({
    uploadFile: jest.fn()
}));

jest.mock('sharp', () => {
    const mSharp = {
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image'))
    };
    return jest.fn(() => mSharp);
});

describe('FileUpload Utility', () => {
    const fileBuffer = Buffer.from('test-image');
    const fileName = 'test.jpg';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('processAndUploadImage should process image and call uploadFile', async () => {
        uploadFile.mockResolvedValue('http://storage.com/test.jpg');
        const result = await processAndUploadImage(fileBuffer, fileName);
        expect(sharp).toHaveBeenCalled();
        expect(uploadFile).toHaveBeenCalled();
        expect(result).toBe('http://storage.com/test.jpg');
    });

    test('uploadDocument should call uploadFile without processing', async () => {
        uploadFile.mockResolvedValue('http://storage.com/test.pdf');
        const result = await uploadDocument(fileBuffer, 'test.pdf');
        expect(sharp).not.toHaveBeenCalled();
        expect(uploadFile).toHaveBeenCalled();
        expect(result).toBe('http://storage.com/test.pdf');
    });
});
