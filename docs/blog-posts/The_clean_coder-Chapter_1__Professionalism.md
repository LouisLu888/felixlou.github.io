---
title: "The clean coder -- Chapter 1: Professionalism"
date: "2018-08-13"
readTime: "5 min read"
category: "公众号"
source: "小唐思考人生的公众号"
excerpt: "Another solid book by “Uncle Bob”. The other famous books by him are _clean code_ and _clean architecture__._"
published: true
---
Another solid book by “Uncle Bob”. The other famous books by him are _clean code_ and _clean architecture__._

In this book, Martin goes through his growth as a engineering and tell us many best practices, his experience. I realized that even people like him also grow up from a new bee and even got fired once due to some serious mistakes he made. The book really opens my mind in some parts and reassurance my understanding in other parts. I enjoyed so much reading this book, especially the first three chapters, so that I finish it in a weekend. I would definitely recommend every junior engineering read this book. The following are some reading notes:

Forward and Preface

Software Engineering are not treated as real professionalism sometimes because a lot of SDEs failed to demonstrate this. SDEs cannot convince business team or the leadership that they can work individually. We need to practice to transform from technician to professionalisms. Martin gives an example comparing a legal team and dev team in the eyes of a leader.

The Space Shuttle Challengers broke up. The failure is due to the leadership doesn’t trust dev team’s judgement. “They thought the engineerings were overreacting. They didn’t trust the engineering’s data or their conclusion. They launched because they were under immense financial and political pressure. They hoped everything would be just fine”.

As an engineering, you have a depth of knowledge about you systems and projects that no managers can possibly have. With that knowledge comes the responsibility to act.

Not related: No one in your life will teach you more than your children will do.

You need to eat some humble pie.

First Chapter: Professionalism

It’s a lot of easier to be a non-professionalism. Non-professionalism don’t have to take responsibility for the job they do — they leave it to their employers.

You see, professionalism is all about take responsibility.

The reason I neglected the test was so I could say I has shipped on time. It was about me saving face. I had not been concerned about the customer, nor about my employer. I had only been concerned about my own reputation. I should have taken responsibility early and told Tom that the test wasn’t completed and that I was not prepared to ship the software on time. That would have been hard and Tom would have been upset. But no customers would have lost data, and no service managers would have called.

First, do not harm. Delay is much better than regression or causing issues.

The fact that bugs will certainly occur in your code doesn’t mean you aren’t responsible for them. The fact that the task to write perfect software is virtually impossible doesn’t mean you are not responsible for the imperfection.

As you mature in your profession, your error rate should rapidly decrease towards the asymptote of zero. It won’t ever get to zero, but it is your responsibility to get as close as possible.

QA should find nothing.

Every code you are not certain about will going to be faulty.

You must know it works!

You only write code because you expect it to get executed. If you expect it to get executed, you ought to know it works. The only way to know is to test it.

If the code is hard to test, redesign the code.

Second, do not harm the structure

It is the structure of your code that allows it to be flexible. If you compromise the structure, you comprise the future.

The fundamental assumption underlying all software projects is that software is easy to change. If you violate this assumption by creating inflexible structures, then you undercut the economic model that the entire industry is based on.

Work Ethic

Those who cannot remember the past are condemned to repeat it.

-   Minimal list of things that every software professional should be conversant with:
    
-   Design Patterns: 24 design patterns
    
-   Design principles: SOLID
    
-   Methods: Scrum, Lean, Kanban, Waterfall
    
-   Discipline: TDD, O-O design, Structured programming, Continuous Integration, Pair programming
    
-   Artifacts: UML, DFDs, Structure charts, flow charts, etc
    

Practice

Doing your daily job is performance, not practice. Practice is when you specifically exercise your skills outside of the performance of your job for the sole purpose of refining and enhancing those skills.

Know your domain
When starting a project in a new domain, read a book or two on the topic. Interview your customer and user about the foundation and basic of the domain. Spend some time with the experts and try to understand their principles and values.

It’s the worst kind of unprofessional behavior to simply code from a spec without understanding why that spec makes sense to business. Rather you should know enough about the domain to be able to recognize and challenge specification errors.

Make sure the feature you are developing are really going to address your employer’s needs.
