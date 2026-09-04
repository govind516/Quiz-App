package com.example.quizapp.leaderboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import com.example.quizapp.user.User;
import com.example.quizapp.user.UserRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class LeaderboardServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private ZSetOperations<String, String> zSetOps;

	private StringRedisTemplate templateReturning(ZSetOperations<String, String> ops) {
		return new StringRedisTemplate() {
			@Override
			public ZSetOperations<String, String> opsForZSet() {
				return ops;
			}
		};
	}

	@Test
	@DisplayName("Degrades to no-op when Redis is not configured")
	void degradesWhenNotConfigured() {
		LeaderboardService service = new LeaderboardService(templateReturning(zSetOps), userRepository, "");

		service.recordSubmission(1L, 2L, 3L, 10, 80.0);

		assertThat(service.topGlobal(10)).isEmpty();
		verifyNoInteractions(zSetOps);
	}

	@Test
	@DisplayName("Returns empty list instead of failing when Redis errors")
	void returnsEmptyOnRedisFailure() {
		when(zSetOps.reverseRangeWithScores(anyString(), anyLong(), anyLong()))
				.thenThrow(new RuntimeException("connection refused"));

		LeaderboardService service = new LeaderboardService(templateReturning(zSetOps), userRepository,
				"rediss://default:pw@example.upstash.io:6379");

		assertThat(service.topGlobal(10)).isEmpty();
	}

	@Test
	@DisplayName("Maps redis tuples to ranked entries with user names")
	void mapsTuplesToEntries() {
		ZSetOperations.TypedTuple<String> tuple1 = tuple("7", 250.5);
		ZSetOperations.TypedTuple<String> tuple2 = tuple("3", 90.0);
		java.util.Set<ZSetOperations.TypedTuple<String>> tuples = new java.util.LinkedHashSet<>();
		tuples.add(tuple1);
		tuples.add(tuple2);
		when(zSetOps.reverseRangeWithScores(anyString(), anyLong(), anyLong())).thenReturn(tuples);
		User u7 = User.builder().id(7L).name("Ada").build();
		User u3 = User.builder().id(3L).name("Lin").build();
		when(userRepository.findAllByIdIn(List.of(7L, 3L))).thenReturn(List.of(u7, u3));

		LeaderboardService service = new LeaderboardService(templateReturning(zSetOps), userRepository,
				"rediss://default:pw@example.upstash.io:6379");

		List<LeaderboardEntryDto> entries = service.topGlobal(10);

		assertThat(entries).containsExactly(
				new LeaderboardEntryDto(1, 7L, "Ada", 250.5),
				new LeaderboardEntryDto(2, 3L, "Lin", 90.0));
	}

	private ZSetOperations.TypedTuple<String> tuple(String member, Double score) {
		return new org.springframework.data.redis.core.DefaultTypedTuple<>(member, score);
	}
}
