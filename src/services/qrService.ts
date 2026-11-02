import QRCode from 'qrcode';

export async function generatePassQR(
    id: string,
    baseURL: string
): Promise<Buffer> {
    const url = new URL(
        `/info/${id}`,
        baseURL
    ).toString();

    return QRCode.toBuffer(url, {
        type: 'png',
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2
    });
}