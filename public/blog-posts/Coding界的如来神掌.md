---
title: "Coding界的如来神掌"
date: "2017-10-18"
readTime: "11 min read"
category: "公众号"
source: "小唐思考人生的公众号"
excerpt: "Chapter 1: Clean code. What? Why? How?"
published: true
---
![](/images/wechat/Coding界的如来神掌/17813965490020.3675248337481217.jpg)

Chapter 1: Clean code. What? Why? How?

They had rushed the product tomarket and had made a huge mess in the code. As they added more and more features, thecode got worse and worse until they simply could not manage it any longer. It was the badcode that brought the company down.

Later equals never.

Over the span of a year or two, teams that were moving very fast at the beginning of a project can find themselves moving at a snail’space.

As productivity decreases, management does the only thing they can;they add more staff to the project in hopes of increasing productivity. But that new staff isnot versed in the design of the system. They don’t know the difference between a changethat matches the design intent and a change that thwarts the design intent. Furthermore,they, and everyone else on the team, are under horrific pressure to increase productivity.

![](/images/wechat/Coding界的如来神掌/17813965490890.15079622999154507.jpg)

“If I don’t do what my manager says, I’ll be fired.” Probably not.Most managers want the truth, even when they don’t act like it. Most managers want goodcode, even when they are obsessing about the schedule. They may defend the schedule andrequirements with passion; but that’s their job. It’s your job to defend the code with equalpassion. So too it is unprofessional for programmers to bend to the will of managers who don’tunderstand the risks of making messes.

True professionals know that the second part of the conundrum is wrong. You will notmake the deadline by making the mess. Indeed, the mess will slow you down instantly, andwill force you to miss the deadline. The only way to make the deadline—the only way togo fast—is to keep the code as clean as possible at all times.

This “code-sense” is the key.

Remember the old joke about the concert violinist who got lost on his way to a perfor-mance? He stopped an old man on the corner and asked him how to get to Carnegie Hall.The old man looked at the violinist and the violin tucked under his arm, and said: “Prac-tice, son. Practice!”

第一章主要讲了为什么要写clean code， 什么是clean code以及如何写clean code. 最近被自己写的以及组里之前的烂代码困扰，开发新feature的速度比想象中慢很多，改一个东西，加一个东西都要改很长的chain,很多class，很多test，对此深有体会，因此下定决心要写更clean 的code。

Chapter 2: Meaning names

Beware of using names which vary in small ways. How long does it take to spot thesubtle difference between a XYZControllerForEfficientHandlingOfStrings in one moduleand, somewhere a little more distant, XYZControllerForEfficientStorageOfStrings? Thewords have frightfully similar shapes.

It is very helpful if names forvery similar things sort together alphabetically and if the differences are very obvious,because the developer is likely to pick an object by name without seeing your copiouscomments or even the list of methods supplied by that class.

Noise words are another meaningless distinction. Imagine that you have a Productclass. If you have another called ProductInfo or ProductData, you have made the names dif-ferent without making them mean anything different. Info and Data are indistinct noisewords like a, an, and the.

When constructors are overloaded, use static factory methods with names that describe the arguments. For example: Complex fulcrumPoint = Complex.FromRealNumber(23.0);

Pick One Word per Concept:  it’s confusing to have a controller and a manager and a driver in the samecode base. What is the essential difference between a DeviceManager and a Protocol-Controller? Why are both not controllers or both not managers? Are they both Driversreally? The name leads you to expect two objects that have very different type as well ashaving different classes.

第二张讲命名，大部分practice我们已经在用，不过还是有很多收获，对名字的理解也更深刻了。

Chapter 3: Functions

The first rule of functions is that they should be small. The second rule of functions is thatthey should be smaller than that.

This implies that the blocks within if statements, else statements, while statements, andso on should be one line long. Probably that line should be a function call. Not only doesthis keep the enclosing function small, but it also adds documentary value because thefunction called within the block can have a nicely descriptive name. This also implies that functions should not be large enough to hold nested structures.Therefore, the indent level of a function should not be greater than one or two. This, ofcourse, makes the functions easier to read and understand.

FUNCTIONS SHOULD DO ONE THING. THEY SHOULD DO IT WELL.THEY SHOULD DO IT ONLY.

If a function does only those steps that are one level below the stated name of thefunction, then the function is doing one thing. After all, the reason we write functions is todecompose a larger concept (in other words, the name of the function) into a set of steps atthe next level of abstraction. So, another way to know that a function is doing more than “one thing” is if you canextract another function from it with a name that is not merely a restatement of its imple-mentation

One Level of Abstraction per Function: In order to make sure our functions are doing “one thing,” we need to make sure that thestatements within our function are all at the same level of abstraction. Mixing levels of abstraction within a function is always confusing.

Switch statement: First, it’s large, and when newemployee types are added, it will grow. Second, it very clearly does more than one thing.Third, it violates the Single Responsibility Principle7 (SRP) because there is more than onereason for it to change. Fourth, it violates the Open Closed Principle8 (OCP) because itmust change whenever new types are added. But possibly the worst problem with thisfunction is that there are an unlimited number of other functions that will have the samestructure. My general rule for switch statements is that they can be tolerated if they appearonly once, are used to create polymorphic objects, and are hidden behind an inheritance relationship so that the rest of the system can’t see them.

A long descriptive name is better than a shortenigmatic name. A long descriptive name is better than a long descriptive comment.

The ideal number of arguments for a function iszero (niladic). Next comes one (monadic), followedclosely by two (dyadic). Three arguments (triadic)should be avoided where possible. More than three(polyadic) requires very special justification—andthen shouldn’t be used anyway.

Arguments are even harder from a testing point of view. Imagine the difficulty ofwriting all the test cases to ensure that all the various combinations of arguments workproperly. If there are no arguments, this is trivial. If there’s one argument, it’s not too hard.With two arguments the problem gets a bit more challenging. With more than two argu-ments, testing every combination of appropriate values can be daunting.

Common Monadic Forms:

There are two very common reasons to pass a single argument into a function. You may beasking a question about that argument, as in boolean fileExists(“MyFile”). Or you may beoperating on that argument, transforming it into something else and returning it.

If a function is going to transform its inputargument, the transformation should appear as the return value.

Flag arguments are ugly. Passing a boolean into a function is a truly terrible practice. Itimmediately complicates the signature of the method, loudly proclaiming that this functiondoes more than one thing. It does one thing if the flag is true and another if the flag is false!

Dyadic Functions:

Dyads aren’t evil, and you will certainly have to write them. However, you should beaware that they come at a cost and should take advantage of what mechanims may beavailable to you to convert them into monads.

Triads:

Reducing the number of arguments by creating objects out of them may seem likecheating, but it’s not. When groups of variables are passed together, the way x andy are in the example above, they are likely part of a concept that deserves a name of itsown.

Have No Side Effects: Side effects are lies. Your function promises to do one thing, but it also does other hiddenthings.

Arguments are most naturally interpreted as inputs to a function. If you have been pro-gramming for more than a few years, I’m sure you’ve done a double-take on an argumentthat was actually an output rather than an input. For example: appendFooter(s);

Does this function append s as the footer to something? Or does it append some footerto s? Is s an input or an output? It doesn’t take long to look at the function signatureand see:

public void appendFooter(StringBuffer report)

This clarifies the issue, but only at the expense of checking the declaration of the function.Anything that forces you to check the function signature is equivalent to a double-take. It’sa cognitive break and should be avoided.

In the days before object oriented programming it was sometimes necessary to haveoutput arguments. However, much of the need for output arguments disappears in OO lan-guages because this is intended to act as an output argument. In other words, it would bebetter for appendFooter to be invoked as

report.appendFooter();

In general output arguments should be avoided. If your function must change the stateof something, have it change the state of its owning object.

Functions should either do something or answer something, but not both. Either yourfunction should change the state of an object, or it should return some information aboutthat object. Doing both often leads to confusion. Consider, for example, the followingfunction:

public boolean set(String attribute, String value);

Try/catch blocks are ugly in their own right. They confuse the structure of the code andmix error processing with normal processing. So it is better to extract the bodies of the tryand catch blocks out into functions of their own.

Error Handling Is One Thing:This implies (as in the example above) that if the keywordtry exists in a function, it should be the very first word in the function and that thereshould be nothing after the catch/finally blocks.

Duplication may be the root of all evil in software. Many principles and practices havebeen created for the purpose of controlling or eliminating it. Consider, for example, thatall of Codd’s database normal forms serve to eliminate duplication in data. Consider alsohow object-oriented programming serves to concentrate code into base classes that wouldotherwise be redundant. Structured programming, Aspect Oriented Programming, Compo-nent Oriented Programming, are all, in part, strategies for eliminating duplication. Itwould appear that since the invention of the subroutine, innovations in software develop-ment have been an ongoing attempt to eliminate duplication from our source code.

Dijkstrasaid that every function, and every block within a function, should have one entry and oneexit. Following these rules means that there should only be one return statement in a func-tion, no break or continue statements in a loop, and never, ever, any goto statements.

Writing software is like any other kind of writing. When you write a paper or an article,you get your thoughts down first, then you massage it until it reads well. The first draftmight be clumsy and disorganized, so you wordsmith it and restructure it and refine it untilit reads the way you want it to read. When I write functions, they come out long and complicated. They have lots ofindenting and nested loops. They have long argument lists. The names are arbitrary, andthere is duplicated code. But I also have a suite of unit tests that cover every one of thoseclumsy lines of code. So then I massage and refine that code, splitting out functions, changing names, elim-inating duplication. I shrink the methods and reorder them. Sometimes I break out wholeclasses, all the while keeping the tests passing. In the end, I wind up with functions that follow the rules I’ve laid down in this chapter.I don’t write them that way to start. I don’t think anyone could.

这是到目前为止最有收获的一章，如果只能看一章的话就看着章吧！总体原则就是smaller than smaller. 最好没参数，绝不能超过3个参数。争取努力实现，果然想作者说的，practice, son, practice。虽然现在大概知道了这些，也能明显知道method大了不好，但是臣妾真的很难做到啊。想起那天Thiago, 我们组experienced打的比方，如果A,B在一起，A 有4 个case，B有3个case，那么合在一起就要test 4 \*3 种，如果分开就只需要4 + 3种。

Prac-tice, son. Practice!
