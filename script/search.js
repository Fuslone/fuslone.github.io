function search(type,input){
    for (let item in type){
        if (typeof type[item]==='object'){
            search(type[item],input);
        }else{
            if (type[item]?.toLowerCase().includes(input)){
                resultNumber++;
                result.push(type);
                return;
            }
        }
    }
}
let result=[];
let resultNumber=0;
const form=(new URL(window.location.href)).searchParams;
if (form.size>0){
    const type=form.get('type');
    const input=form.get('search').toLowerCase();
fetch('search.json')
.then(response=>{
    if (!response.ok){
        throw new Error(`错误: ${response.status}`);
    }
    return response.json();
}).then(data=>{
    if (type===null){
        search(data,input);
    }else{
        search(data[`${type}`],input);
    }
    console.log(result);
}).catch(error=>{
    console.error(error);
});
}