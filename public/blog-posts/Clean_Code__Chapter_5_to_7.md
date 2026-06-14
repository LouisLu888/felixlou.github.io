---
title: "Clean Code: Chapter 5 to 7"
date: "2017-11-04"
readTime: "5 min read"
category: "公众号"
source: "小唐思考人生的公众号"
excerpt: "Chapter 7: Error Handling"
published: true
---
Chapter 7: Error Handling

However, it is clear now that they aren’t necessary for the production of robust software. C# doesn’t have checked exceptions, and despite valiant attempts, C++doesn’t either. Neither do Python or Ruby. Yet it is possible to write robust software in all of these languages. Because that is the case, we have to decide—really—whether checked exceptions are worth their price.

What price? The price of checked exceptions is an **Open/Closed Principle violation**. If you throw a checked exception from a method in your code and the catch is three levels above, you must declare that exception in the signature of each method between you and the catch. This means that a change at a low level of the software can force signaturechanges on many higher levels. The changed modules must be rebuilt and redeployed,even though nothing they care about changed.

**Checked exceptions can sometimes be useful if you are writing a critical library: You must catch them. But in general application development the dependency costs outweighthe benefits.**

There are many ways to classify errors. We can classify them by their source: Did they come from one component or another? Or their type: Are they device failures, network failures, or programming errors? However, when we define exception classes in an application, our most important concern should be how they are caught.

Wrappers like the one we defined for ACMEPort can be very useful. **In fact, wrapping third-party APIs is a best practice. When you wrap a third-party API, you minimize your dependencies upon it**: You can choose to move to a different library in the future withoutmuch penalty. Wrapping also makes it easier to mock out third-party calls when you are testing your own code. One final advantage of wrapping is that you aren’t tied to a particular vendor’s API design choices. 

Don’t Return Null: When we return null, we are essentially creating work for ourselves and foistingproblems upon our callers. All it takes is one missing null check to send an applicationspinning out of control.

If you are tempted to return null froma method, consider throwing an exception or returning a SPECIAL CASE object instead. If you are calling a null\-returning method from a third-party API, consider wrapping that method with a method that either throws an exception or returns a special case object.

Returning null from methods is bad, but passing null into methods is worse. Unless youare working with an API which expects you to pass null, you should avoid passing null inyour code whenever possible.

最好不要用checked exception，不然有改动一整条chain都要改。不要返回null，不要pass null.

Chapter 8: Boundaries

Using Third-Party Code：

We are not suggesting that every use of Map be encapsulated in this form. Rather, weare advising you not to pass Maps (or any other interface at a boundary) around your system. If you use a boundary interface like Map, keep it inside the class, or close family of classes, where it is used. Avoid returning it from, or accepting it as an argument to, public APIs.

Interesting things happen at boundaries. Change is one of those things. Good software designs accommodate change without huge investments and rework. When we use codethat is out of our control, special care must be taken to protect our investment and make sure future change is not too costly.

Code at the boundaries needs clear separation and tests that define expectations. We should avoid letting too much of our code know about the third-party particulars. It’s betterto depend on something you control than on something you don’t control, lest it end upcontrolling you.

We manage third-party boundaries by having very few places in the code that refer to them. We may wrap them as we did with Map, or we may use an ADAPTER to convert fromour perfect interface to the provided interface. Either way our code speaks to us better, promotes internally consistent usage across the boundary, and has fewer maintenance points when the third-party code changes.

跟其他服务communication的时候要小心，要想到有可能的变化，并把可能的变化降到最低。Be friend with your neighbours but don’t trust them!

Chapter 9: Unit Tests

The Three Laws of TDD:

First Law You may not write production code until you have written a failing unit test.

Second Law You may not write more of a unit test than is sufficient to fail, and not compiling is failing.

Third Law You may not write more production code than is sufficient to pass the cur-rently failing test.

What makes a clean test? Three things. Readability, readability, and readability. Read-ability is perhaps even more important in unit tests than it is in production code. Whatmakes tests readable? The same thing that makes all code readable: clarity, simplicity,and density of expression.

Timely The tests need to be written in a timely fashion. Unit tests should be written just before the production code that makes them pass. If you write tests after the production code, then you may find the production code to be hard to test. You may decide that some production code is too hard to test. You may not design the production code to be testable.

Hello, guys. 不知道你们读的怎么样了啊？欢迎offline分享交流哦 ：）
