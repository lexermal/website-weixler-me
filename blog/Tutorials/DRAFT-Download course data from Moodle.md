# Automatically download course content from a Moodle server

Let's say you are at the end of your education period in a school or university and want to download the course data of the Moodle server before you don't have access to it anymore.

This tutorial shows you how to comfortably download all course content.

Remarks: For it to work the Moodle server has to have the **DownloadCenter** plugin installed! You can check it by going into a Moodle course, clicking on the burger menu at the top left and see if on the left the words "Download Center" are written.

WARNING: Keep in mind this method of downloading all content might produce a heavy load on the Moodle server. Therefore, be caution. If any damage is caused by the tool I, the author, take no responsibility.

## Getting the course IDs
To download all courses first of the IDs of the courses need to be determined.

To do so log into the Moodle server.

On the course overview page (https://moodle.example.com/my) select "All" from the drop-down menu.

Right-click on the page and select "Inspect". Click on the "Console" tab and enter the following to get the IDs:

```[...document.getElementsByClassName("list-group-item course-listitem")].map(e=>e.getAttribute("data-course-id"))```

The result shown are the IDs. Copy them.


## Setting up the download script
To download the course data from Moodle, Cypress is used. It's a testing framework for webpages, but also suitable for this task.

First of, install it with the following command in an empty directory
```npm install cypress --save-dev```

Then run it and follow the configuration steps for E2E tests:
 ```yarn run cypress open```

Cypress generated for you some sample tests under *./cypress/e2e/*. You can delete them.

In the *e3e* folder create a file called *download.cy.js* with the following content:

    // @ts-check
    /// <reference types="cypress" />

    const moodleUrl = "https://moodle.example.com"; // the url of your Moodle server
    const username = "my_username";  //your username
    const password = "my_password!"; //your password
    const courseIDs = ['5614', '5607', .... ];  // the course ids you compied earlier
    const timeBetweenDownloads = 5; //seconds that are waited till the next course get's downloaded. It is recommended to be set at a larger number to not take too much ressources of the server.
    const serverTimeout = 30; //This is the time the moodle server has for generating the course download file. For a shorter period of the whole execution time of the script this parameter could be set lower, but after this time pased the script will fail.

    describe('file download', () => {
        it('Course file', () => {
            cy.visit(moodleUrl + '/login/index.php');
            cy.get('input#username').type(username);
            cy.get('input#password').type(password);
            cy.get('button#loginbtn').click();

            courseIDs.forEach(course => downloadFile(course));
            cy.wait(60000);
            expect(true).to.equal(true);
        });
    });


    function downloadFile(id) {
        cy.visit(moodleUrl + '/local/downloadcenter/index.php?courseid=' + id);

        cy.window().document().then(function (doc) {
            doc.addEventListener('click', () => {
                setTimeout(function () { doc.location.reload(); }, serverTimeout * 1000);
            });
            cy.get('input#id_submitbutton').click();
        });

        cy.log('**Started downloading the course content**');
        cy.wait(timeBetweenDownloads * 1000);
    }

Adjust the parameter at the top of the file with the Moodle server domain, your credentials and the course IDs.
If you want you can tweak the timing parameters for a faster execution time. But keep in mind this rises the risk of the script to fail at courses with much content, and it will rise the workload the server has to handle.

You can run now the script by opening with ```yarn run cypress open```.
The content will be downloaded to the folder ./cypress/downloads

It is generally recommended running the script at times when no one might need the Moodle server, like in the night.


## Remarks

Feel free to improve the script and post it as comment. I will update the post and mention you.