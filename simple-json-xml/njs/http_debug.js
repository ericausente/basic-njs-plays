function json_to_xml(r) {
    try {
        r.error(`Raw request body: ${r.requestText}`);

        r.error('Parsing JSON body');
        // Parse JSON body
        let json = JSON.parse(r.requestText);

        r.error('Converting JSON to XML');
        // Convert JSON to XML (simple conversion for demonstration)
        let xml = '<request>';
        for (let key in json) {
            xml += `<${key}>${json[key]}</${key}>`;
        }
        xml += '</request>';

        r.error(`Sending XML to ADC: ${xml}`);
        // Send XML to ADC and get response
        ngx.fetch('http://172.29.90.23:8080/request.asmx', {
            method: 'POST',
            body: xml,
            headers: {'Content-Type': 'application/xml'}
        }).then(reply => {
            r.error('Received response from ADC');
            return reply.text();
        }).then(body => {
            r.error(`Response body: ${body}`);
            // Convert XML response back to JSON
            let jsonResponse = {};
            let matches = body.match(/<(\w+)>(.*?)<\/\1>/g);

            if (matches) {
                matches.forEach(match => {
                    let parts = match.match(/<(\w+)>(.*?)<\/\1>/);
                    jsonResponse[parts[1]] = parts[2];
                });
            }

            r.error(`Converted JSON response: ${JSON.stringify(jsonResponse)}`);
            r.headersOut['Content-Type'] = 'application/json';
            r.return(200, JSON.stringify(jsonResponse));
        }).catch(err => {
            r.error(`Error in fetch: ${err.message}`);
            r.return(502, `Error: ${err.message}`);
        });
    } catch (e) {
        r.error(`Error in processing request: ${e.message}`);
        r.return(400, 'Invalid JSON');
    }
}

export default { json_to_xml };
