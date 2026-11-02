import { writeFile } from 'node:fs/promises';

export async function getToken(
    authority: string,
    audience: string,
    clientId: string,
    clientSecret: string,
    scope: string
): Promise<string> {

    const tokenUrl =
        `${authority.replace(/\/+$/, '')}/oauth/token`;

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience,
            scope
        })
    });

    if (!response.ok) {
        throw new Error(
            `Token request failed: ${response.status} ${response.statusText}`
        );
    }

    const data: unknown = await response.json();

    if (
        typeof data !== 'object' ||
        data === null ||
        !('access_token' in data) ||
        typeof data.access_token !== 'string'
    ) {
        throw new Error('Invalid token response');
    }

    return data.access_token;
}

export async function issuePass(
    url: string,
    token: string,
    name: string,
    document: string
): Promise<void> {

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            document
        })
    });

    if (!response.ok) {
        throw new Error(
            `Pass creation failed: ${response.status} ${response.statusText}`
        );
    }

    if (response.status !== 201) {
        throw new Error(
            `Unexpected response status: ${response.status}`
        );
    }

    const location = response.headers.get('Location');

    if (!location) {
        throw new Error('Missing Location header');
    }

    const pathname = new URL(location, url).pathname;
    const id = pathname.split('/').filter(Boolean).pop();

    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
        throw new Error('Invalid pass identifier');
    }

    const contentType = response.headers.get('Content-Type');

    if (!contentType?.toLowerCase().startsWith('image/png')) {
        throw new Error('Expected image/png response');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(`${id}.png`, buffer);
}
