/**
 * Create a person.
 * 
 * @param {FamilySearch} client
 * @param {Function} callback - is given the new person's ID on success, nothing on error
 */
module.exports = function createPerson(client, callback){
  client.post('/platform/tree/persons', {
    body: {
      "persons": [
        {
          "living": true,
          "gender": {
            "type": "http://gedcomx.org/Male"
          },
          "names": [
            {
              "type": "http://gedcomx.org/BirthName",
              "preferred": true,
              "nameForms": [
                {
                  "fullText": "Jacob",
                  "parts": [
                    {
                      "value": "Jacob",
                      "type": "http://gedcomx.org/Given"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }, function(error, response){
    if(response && response.statusCode === 201){
      callback(response.headers['x-entity-id']);
    } else {
      callback();
    }
  });
}