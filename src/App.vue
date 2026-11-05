<script setup lang="ts">
import { reactive } from 'vue';
import ConverterIntro from './components/ConverterIntro.vue';
import BarView from './components/BarView.vue';
import type { UserData } from './types';
import { normalize } from './utils/keys';
import { retrieveUserData, writeToUserData } from './utils/user-data';

const userData = reactive<UserData>(retrieveUserData());
function updateUserData(data: Partial<UserData>) {
  Object.assign(userData, data);
  writeToUserData(userData);
}
function start() { updateUserData({ appStep: 1 }); }
function reset() {
  for (const key of Object.keys(userData)) delete (userData as unknown as Record<string, unknown>)[key];
  updateUserData({ appStep: 0, userKey: 'C' });
}
</script>

<template>
  <div class="container">
    <div class="header clearfix">
      <ul class="nav justify-content-center">
        <li class="nav-item p-1">Active key: <span id="active-key">{{ userData.userKey }}</span></li>
      </ul>
    </div>
    <ConverterIntro v-if="userData.appStep === 0" :user-key="userData.userKey"
      @key-change="userData.userKey = normalize($event)" @start="start" />
    <BarView v-else :user-data="userData" @update="updateUserData" @reset="reset" />
  </div>
  <footer class="footer py-4 bg-secondary text-white">
    <div class="container text-center">
      Made by Harry Lincoln and still very much a WIP.
      <a href="https://github.com/harrylincoln/notate/">Submit a PR and contribute!</a>
    </div>
  </footer>
</template>
