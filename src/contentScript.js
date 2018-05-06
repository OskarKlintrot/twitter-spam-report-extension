const template = username => 
`<span>
    <button type="button" id="reportButtonExtension" class="
        EdgeButton
        EdgeButton--danger
        EdgeButton--small 
        
        button-text
        follow-text">
        <span aria-hidden="true">Spam</span>
        <span class="u-hiddenVisually">Report <span class="username u-dir u-textTruncate" dir="ltr">@<b>${username}</b></span></span>
    </button>
</span>`

async function getContext (currentUserId, userId) {
    let result = {}

    const authTokenString = 'authenticity_token'
    const contextString = 'context'

    try {
        await $.get(`https://twitter.com/i/safety/report_story?client_location=me%3Afollowers%3Auser&client_referer=%2F&is_media=false&is_promoted=false&lang=sv&next_view=report_story_start&reported_user_id=${userId}&reporter_user_id=${currentUserId}&source=reportprofile`,
            body => {
                result.context = $(body).find(`[name="${contextString}"]`).val()
                result.authToken = $(body).find(`[name="${authTokenString}"]`).val()
            }, 'html')

        return result;
    } catch (error) {
        console.error(error)
    }
}

async function handleReport (currentUserId, username, userId, elementToRemove) {
    const context = await getContext(currentUserId, userId)

    const reportParams = `authenticity_token=${context.authToken}&context=${context.context}&lang=sv&is_mobile=false&report_type=spam`;
    const blockParams = `authenticity_token=${context.authToken}&challenges_passed=false&handles_challenges=1&impression_id=&user_id=${userId}`;
    
    await xhr('POST', 'https://twitter.com/i/safety/report_story', reportParams)
    await xhr('POST', 'https://twitter.com/i/user/block', blockParams)
    
    console.log(`Successfully reported and blocked ${username}`)

    elementToRemove.remove()
}

const xhr = (method, url, params) => {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest()
        xhr.open(method, url, true)
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8")
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
        xhr.setRequestHeader("X-Twitter-Active-User", "yes")
        xhr.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01")
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 302)) {
                resolve(xhr.response)
            } else if (xhr.readyState == 4) {
                reject(xhr.response)
            }
        };
        xhr.send(params)
    })
}

const addButton = () => {
    console.log('Will add buttons')

    const currentUserId = $('#current-user-id').val()
    
    $('.GridTimeline-items')
        .find('.user-actions')
        .each((_index, element) => {
            if ($(element).find('#reportButtonExtension').length === 0) {
                const screenName = $(element).data('screen-name')
                const userId = $(element).data('user-id')
                const button = $(template(screenName))
                const removeOnSucess = $(element).closest('.ProfileCard')
                
                button.click(() => handleReport(currentUserId, screenName, userId, removeOnSucess))
                button.insertAfter($(element).find('.user-actions-follow-button'))
            }
        })
}


window.onload = () => { 
    let targetNode = document.getElementsByClassName('GridTimeline')[0]
    const config = { subtree: true, childList: true }
    const observer = new MutationObserver(() => {
        console.log('DOM mutated')
        addButton()
    })
    
    if (targetNode) {
        addButton()
        observer.observe(targetNode, config)
    }

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            console.log('Chrome runtime message recived')
            if (request.addButton)
            {
                // Hacky but it's the only way I could figure out how to get it working
                // when you do the first change the your followers-page
                setTimeout(() => {
                    addButton()
                    sendResponse({success: true})
                }, 1000)
            }

            // If targetNode is not set, try again 
            if (!targetNode) {
                let targetNode = document.getElementsByClassName('GridTimeline')[0]
                // Use DOM observer since it can take too long before the DOM is
                // rendered so just triggering on message alone is not enough
                observer.observe(targetNode, config) 
            }
    })
}
