//much more adhoc method used, this file is not used
export interface Admin{
    email:String,
    password:String,
    name:String
}

export interface Blog{
    title:String,
    slug:String,
    content:String,
    
}

export interface Letter {
    title:String,
    content:String,
    date:String, //this is not createdAt this the symbolic date for the letter

}

export interface Poem {
    title:String,
    content:String,

}

export interface Journal {
    title:String,
    content:String,
    synopsis: String
    slug: String
}

export interface NewsLetter {
    title:String,
    subject:String,
    content:String,

}

export interface Subscriber {
    email:String
}