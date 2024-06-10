package org.budgetai.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        // print open api env variable
        System.out.println("open api env variable: " + System.getenv("SPRING_AI_OPENAI_API_KEY"));
        System.out.println("running class with fully qualified name: " + Application.class.getName());
        SpringApplication.run(Application.class, args);
    }

}
