```
async function fetchAndCompareVersions(r) {
    try {
        // Fetch local version
        const response = await ngx.fetch('http://127.0.0.1/api/8/nginx/?fields=version');
        const responseData = await response.json();
        const localVersion = responseData.version;
        ngx.log(ngx.ERR, `Local version JSON response: ${JSON.stringify(responseData)}`);
        ngx.log(ngx.ERR, `Local version final: ${localVersion}`);
        // Fetch latest version from the other endpoint

        const latestResponse = await ngx.fetch('http://version.nginx.com/nginx/stable');
        const latestData = await latestResponse.text();
        const latestVersion = latestData.substring(0, 6);
        ngx.log(ngx.ERR, `Latest version: ${latestVersion}`);

        // Compare versions
        if (localVersion < latestVersion) {
                r.return(200, `Your version (${localVersion}) is behind the latest (${latestVersion})`);
        } else if (localVersion > latestVersion) {
                r.return(200, `Your version (${localVersion}) is ahead of the latest (${latestVersion})`);
        } else {
                r.return(200, `Your version (${localVersion}) is up to date`);
                                                                }
    } catch (e) {
        r.return(500, `Failed to fetch local NGINX version: ${e}`);
    }
}

// Export the function
export default { fetchAndCompareVersions };

```


## With Comments

This function fetches the local NGINX version, fetches the latest NGINX version from a different endpoint,
// compares the versions, and returns a message indicating the version status.

async function fetchAndCompareVersions(r) {
    try {
        // Fetch local version
        const response = await ngx.fetch('http://127.0.0.1/api/8/nginx/?fields=version');
        const responseData = await response.json();
        const localVersion = responseData.version;

        // Log the JSON response of the local version for debugging
        ngx.log(ngx.ERR, `Local version JSON response: ${JSON.stringify(responseData)}`);

        // Log the final local version for debugging
        ngx.log(ngx.ERR, `Local version final: ${localVersion}`);

        // Fetch latest version from the other endpoint
        const latestResponse = await ngx.fetch('http://version.nginx.com/nginx/stable');
        const latestData = await latestResponse.text();

        // Extract the first 6 characters to get the latest version
        const latestVersion = latestData.substring(0, 6);

        // Log the latest version for debugging
        ngx.log(ngx.ERR, `Latest version: ${latestVersion}`);

        // Compare versions
        if (localVersion < latestVersion) {
            r.return(200, `Your version (${localVersion}) is behind the latest (${latestVersion})`);
        } else if (localVersion > latestVersion) {
            r.return(200, `Your version (${localVersion}) is ahead of the latest (${latestVersion})`);
        } else {
            r.return(200, `Your version (${localVersion}) is up to date`);
        }
    } catch (e) {
        // Return an error response if fetching or comparing versions fails
        r.return(500, `Failed to fetch local NGINX version: ${e}`);
    }
}

// Export the fetchAndCompareVersions function for use in other parts of the code
export default { fetchAndCompareVersions };
