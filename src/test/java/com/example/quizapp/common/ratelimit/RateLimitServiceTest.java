package com.example.quizapp.common.ratelimit;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RateLimitServiceTest {

	@Test
	@DisplayName("Allows up to the limit then rejects with TooManyRequestsException")
	void allowsUpToLimitThenRejects() {
		RateLimitService service = new RateLimitService(2, 5, 5, 60);

		assertThatCode(() -> service.checkSubmit("g:abc")).doesNotThrowAnyException();
		assertThatCode(() -> service.checkSubmit("g:abc")).doesNotThrowAnyException();
		assertThatThrownBy(() -> service.checkSubmit("g:abc"))
				.isInstanceOf(TooManyRequestsException.class);
	}

	@Test
	@DisplayName("Different identities have independent buckets")
	void independentBuckets() {
		RateLimitService service = new RateLimitService(1, 1, 1, 60);

		service.checkAuth("ip:1.2.3.4");
		assertThatThrownBy(() -> service.checkAuth("ip:1.2.3.4"))
				.isInstanceOf(TooManyRequestsException.class);
		assertThatCode(() -> service.checkAuth("ip:1.2.3.5")).doesNotThrowAnyException();

		service.checkSubmit("u:9");
		assertThatCode(() -> service.checkStart("u:9")).doesNotThrowAnyException();
	}

	@Test
	@DisplayName("Separate policies do not interfere")
	void separatePolicies() {
		RateLimitService service = new RateLimitService(1, 3, 3, 60);

		service.checkStart("u:7");
		service.checkStart("u:7");
		service.checkStart("u:7");
		assertThatThrownBy(() -> service.checkStart("u:7")).isInstanceOf(TooManyRequestsException.class);
		assertThatCode(() -> service.checkSubmit("u:7")).doesNotThrowAnyException();
	}
}
