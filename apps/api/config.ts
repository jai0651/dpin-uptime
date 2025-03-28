function formatKey(key: string): string {
    return key.includes('\n') ? key : key.replace(/\\n/g, '\n');
}

const rawKey = process.env.JWT_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlYQtpDLaLt61wXomgoKi
xQYZSXkobo9NqQIj28S2BVRdlyp2feo76ZyCF7OAHfb09XGKKlySS74V8Qs3MCME
9EOp4mWYY3JG+aHoJtB5slHhKGaFyWfYSECzsCn4pkqRZsXS479PcdBRMqsH1Uqt
QQgWox5N+ZuS5IrAtYRlr+TMhGv+G2qwfWs3dUXaqkDNvgHbAzH8sFmlIidfgaKP
jXTXrC0eNZAkm0EfI8/ivtmM6O7XYUnOTB/OX5oNjhuMPUYfAENd605kfL1Mcn/M
xTToLgFv2dKS31Qkr5N8MZ5J6VJswSZ2Bv8j6xC419dR71upSJdgrWe58euTS2do
7QIDAQAB
-----END PUBLIC KEY-----`;

export const JWT_PUBLIC_KEY = formatKey(rawKey);
