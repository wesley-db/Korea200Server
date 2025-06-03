import {DOMParser} from '@xmldom/xmldom';

export async function translate(url, key, kWord) {
    const parser = new DOMParser();
    //const encoder = new TextEncoder();//To ensure the kWord is UTF-8 encoded
    const reqIDs = `${url}search?key=${key}&translated=y&trans_lang=1&q=${kWord}`;

    /*Get IDs & translation info*/
    const reqTrans = await fetch(reqIDs)
        .then(resp => resp.text())
        .then(resp => {
            const xmldoc = parser.parseFromString(resp , "text/xml");
            const idNodes = xmldoc.getElementsByTagName("target_code");
            
            //return Array.from(idNodes, node => node.textContent);
            return Array.from(idNodes, node => 
                fetch(`${url}view?key=${key}&method=target_code&translated=y&trans_lang=1&q=${node.textContent}`)
                    .then(resp => resp.text())
                    .then(resp => parser.parseFromString(resp , "text/xml"))
            );
        }).catch(err => {
            console.error(err);
            return false;
        }
    );

    /*Reformat the translation info into a js object*/
    return await Promise.all(reqTrans)
        .then(resp => {
            if (!resp[0].getElementsByTagName("item")[0])
                return false

            //extract the 단어
            //extract id
            //extract the english meaning
            //ectract the pronounciation audio
            //extract examples
            //put everything into a list of object,i.e., [{},{}]
            const itemList = [];
            resp.forEach(xmldoc => {
                const item = xmldoc.getElementsByTagName("item")[0];

                const id = item.getElementsByTagName("target_code")[0].textContent;
                const kWord = item.getElementsByTagName("word")[0].textContent;
                const trans = item.getElementsByTagName("trans_word");
                const meaningList = [];
                for (let i = 0; i < trans.length; i ++)
                    meaningList.push(trans[i].textContent);
                const audio = item.getElementsByTagName("pronunciation_info")[0]?.getElementsByTagName("link")[0].textContent;
                const examples = item.getElementsByTagName("example");
                const egList = [];
                for (let i = 0; i < examples.length; i ++)
                    egList.push(item.getElementsByTagName("example")[i].textContent);

                itemList.push(
                    {
                        id: id,
                        kWord: kWord,
                        meaning: meaningList,
                        audio: audio,
                        examples: egList
                    }
                );
            });
            return itemList;
        }).catch(err => console.error(err));  
}
        