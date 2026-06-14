---
title: "Clean code(Chapter 4 to 6)"
date: "2017-10-21"
readTime: "7 min read"
category: "公众号"
source: "小唐思考人生的公众号"
excerpt: "**Chapter 4: Comments**"
published: true
---
![](/images/wechat/Clean_codeChapter_4_to_6/17813965487820.23706876781790132.jpg)

**Chapter 4: Comments**

“Don’t comment bad code—rewrite it.”

别TM解释了，快上车吧！

Comments are not like Schindler’s List. They are not “pure good.” Indeed, commentsare, at best, a necessary evil. The proper use of comments is to compensate for our failure to express ourself incode.

Why am I so down on comments? Because they lie. Not always, and not intentionally,but too often. The older a comment is, and the farther away it is from the code it describes,the more likely it is to be just plain wrong. The reason is simple. Programmers can’t realis-tically maintain them.

Inaccurate comments are far worse than no comments at all.

If you are writing a public API, then you should certainly write good javadocs for it. But keep in mind the rest of the advice in this chapter. Javadocs can be just as misleading,nonlocal, and dishonest as any other kind of comment. 

Don’t Use a Comment When You Can Use a Function or a Variable

这章就是说别用comment除非迫不得以，用code表达你自己. 本来我觉得不能用comment，后来又觉得java doc还挺有必要的，现在又觉得还是show me the code吧，心累。Computer language is way better designed than natural language, so why bother using natural language to expree yourself.

![](/images/wechat/Clean_codeChapter_4_to_6/17813965489960.8518706870405309.jpg)

**Chapter 5: Formatting**

Vertical Formatting:

Concepts that are closely related should be kept vertically close to each other

Variables should be declared as close to their usage as possi-ble.

Instance variables, on the other hand, should be declared at the top of the class.

Horizontal Formatting:

无话可说。。。尬

这章我们也已经在follow了，感谢我们组共同的的check-style，感谢二哥。

Chapter 6: Object and data structure

There is a reason that we keep our variables private. We don’t want anyone else to dependon them. We want to keep the freedom to change their type or implementation on a whimor an impulse. Why, then, do so many programmers automatically add getters and settersto their objects, exposing their private variables as if they were public?

是啊。想起好像我们确实把每个class都加了getter, setter, 甚至@Data. 那跟public还有啥区别。。。

Hiding implementation is not just a matter of putting a layer of functions betweenthe variables. Hiding implementation is about abstractions! A class does not simplypush its variables out through getters and setters. Rather it exposes abstract interfacesthat allow its users to manipulate the essence of the data, without having to know itsimplementation.

Serious thought needsto be put into the best way to represent the data that an object contains. The worst option isto blithely add getters and setters.

Objects hide their data behind abstractions and expose functions that operate on that data. Data structure expose their data and have no meaningful functions.

This exposes the fundamental dichotomy between objects and data structures:

Procedural code (code using data structures) makes it easy to add new functions withoutchanging the existing data structures. OO code, on the other hand, makes it easy to addnew classes without changing existing functions.

The complement is also true:

Procedural code makes it hard to add new data structures because all the functions mustchange. OO code makes it hard to add new functions because all the classes must change.

In any complex system there are going to be times when we want to add new datatypes rather than new functions. For these cases objects and OO are most appropriate. Onthe other hand, there will also be times when we’ll want to add new functions as opposedto data types. In that case procedural code and data structures will be more appropriate.

The Law of Demeter： There is a well-known heuristic called the Law of Demeter2 that says a module should notknow about the innards of the objects it manipulates. As we saw in the last section, objectshide their data and expose operations. This means that an object should not expose itsinternal structure through accessors because to do so is to expose, rather than to hide, itsinternal structure.

The following code appears to violate the Law of Demeter (among other things)because it calls the getScratchDir() function on the return value of getOptions() and thencalls getAbsolutePath() on the return value of getScratchDir().

final String outputDir = ctxt.getOptions().getScratchDir().getAbsolutePath();

Whether this is a violation of Demeter depends on whether or not ctxt, Options, andScratchDir are objects or data structures. If they are objects, then their internal structureshould be hidden rather than exposed, and so knowledge of their innards is a clear viola-tion of the Law of Demeter. On the other hand, if ctxt, Options, and ScratchDir are justdata structures with no behavior, then they naturally expose their internal structure, and soDemeter does not apply.

This confusion sometimes leads to unfortunate hybrid structures that are half object andhalf data structure. They have functions that do significant things, and they also have eitherpublic variables or public accessors and mutators that, for all intents and purposes, makethe private variables public, tempting other external functions to use those variables theway a procedural program would use a data structure. Such hybrids make it hard to add new functions but also make it hard to add new datastructures. They are the worst of both worlds. Avoid creating them. They are indicative of amuddled design whose authors are unsure of—or worse, ignorant of—whether they needprotection from functions or types.

If it is a object, we should ask it to do something; If it is a data structure, we should ask it about itslef.

DTO: The quintessential form of a data structure is a class with public variables and no func-tions. This is sometimes called a data transfer object, or DTO. DTOs are very useful struc-tures, especially when communicating with databases or parsing messages from sockets,and so on.

Active Records are special forms of DTOs. They are data structures with public (or bean-accessed) variables; but they typically have navigational methods like save and find. Typi-cally these Active Records are direct translations from database tables, or other datasources.

Objects expose behavior and hide data. This makes it easy to add new kinds of objectswithout changing existing behaviors. It also makes it hard to add new behaviors to existingobjects. Data structures expose data and have no significant behavior. This makes it easy toadd new behaviors to existing data structures but makes it hard to add new data structuresto existing functions.

这章是讲Objects hide their data behind abstractions and expose functions that operate on that data. Data structure expose their data and have no meaningful functions. In any complex system there are going to be times when we want to add new datatypes rather than new functions. For these cases objects and OO are most appropriate. Onthe other hand, there will also be times when we’ll want to add new functions as opposed to data types. In that case procedural code and data structures will be more appropriate. 因为现在软件越来越复杂，添加another data type 比添加function情况要多得多，所以OO才会流行。对OO的理解还是不够深啊，感觉要多看写例子，多遇到些例子才能有更好的领会。

Practice, son, practice!

![](/images/wechat/Clean_codeChapter_4_to_6/17813965490650.22089158386373353.jpg)
