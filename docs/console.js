var client = new FamilySearch({
      appKey: 'a02j000000JBxOxAAL'
    }),
    $url = document.getElementById('url'),
    $method = document.getElementById('method'),
    $output = document.getElementById('output');

// Setup event listeners

document.getElementById('load-button').addEventListener('click', makeRequest);

$url.addEventListener('keypress', function(e){
  var key = e.which || e.keyCode;
  if(key === 13){
    makeRequest();
  }
});

// Initialize with a request on load
makeRequest();

/**
 * Send a request to the API and display the response
 */
function makeRequest(){
  output('Sending the request...');
  client.request($url.value, $method.value, function(response){
    if(!response){
      output('Network error. Try again.');
    } else {
      displayResponse(response);
    }
  });
}

/**
 * Display an API response
 * 
 * @param {Object} response
 */
function displayResponse(response){
  
  // Gather and display HTTP response data
  var lines = [
    response.statusCode + ' ' + response.statusText,
    response.getAllHeaders()
  ];
  if(response.data){
    lines.push(prettyPrint(response.data));
  }
  output(lines.join('\n'));
  
  // Attach listeners to links so that clicking a link will auto-populate
  // the url field
  Array.from($output.querySelectorAll('.link')).forEach(function(link){
    link.addEventListener('click', function(){
      // Remove leading and trailing "
      $url.value = link.innerHTML.slice(1,-1);
      window.scrollTo(0, 0);
    });
  });
}

/**
 * Display HTML in the response output container
 * 
 * @param {String} html
 */
function output(html){
  $output.innerHTML = html;
}

/**
 * Pretty print a JSON object
 * 
 * @param {Object} obj
 * @return {String} html string
 */
function prettyPrint(obj){
  return syntaxHighlight(JSON.stringify(obj, null, 4));
}

/**
 * Parse a JSON string and wrap data in spans to enable syntax highlighting.
 * 
 * http://stackoverflow.com/a/7220510
 * 
 * @param {String} JSON string
 * @returns {String}
 */
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number',
        url = false;
    if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
          if(match.indexOf('"https://') === 0){
            // url = true;
            cls += ' link';
          }
        }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    var html = '<span class="' + cls + '">' + match + '</span>';
    if(url){
      html = '<a href>' + html + '</a>';
    }
    return html;
  });
}